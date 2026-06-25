import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto, UpdateOrganizationDto, InviteMemberDto } from '@crm/dto';
import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class TenantService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Bootstraps a new tenant workspace atomically inside a database transaction.
   */
  async bootstrapTenant(registerDto: RegisterDto) {
    // 1. Verify subdomain and email uniqueness
    const existingTenant = await this.prisma.tenant.findUnique({
      where: { subdomain: registerDto.subdomain },
    });
    if (existingTenant) {
      throw new ConflictException('Subdomain is already registered.');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });
    if (existingUser) {
      throw new ConflictException('Email is already registered.');
    }

    // 2. Hash password using Argon2id
    const passwordHash = await argon2.hash(registerDto.password);

    // 3. Execute transaction with custom timeout (30s) to survive high-latency WAN environments
    return this.prisma.$transaction(async (tx) => {
      // A. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: registerDto.businessName,
          subdomain: registerDto.subdomain,
          industryType: registerDto.industryType,
          status: 'ACTIVE',
        },
      });

      // B. Create Owner User
      const ownerUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          email: registerDto.email,
          passwordHash,
          isEmailVerified: true, // Auto-verified for bootstrapping owner in this flow
          status: 'ACTIVE',
        },
      });

      // C. Resolve Pricing Plan
      let plan = await tx.subscriptionPlan.findUnique({
        where: { name: registerDto.planName.toUpperCase() },
      });

      // Seed default plan if not present
      if (!plan) {
        plan = await tx.subscriptionPlan.create({
          data: {
            name: registerDto.planName.toUpperCase(),
            priceMonthly: 79.0,
            priceYearly: 790.0,
            maxUsers: 10,
            maxWarehouses: 3,
            maxProducts: 5000,
            features: {
              crm: true,
              inventory: true,
              sales: true,
              pos: true,
              purchases: true,
              finance: true,
            },
          },
        });
      }

      // D. Create Trial Tenant Subscription (14-day grace)
      await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          planId: plan.id,
          status: 'TRIALING',
          billingCycle: 'MONTHLY',
          trialStart: new Date(),
          trialEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      });

      // E. Resolve Global Template Configuration
      let templateCode = registerDto.industryType.toUpperCase();
      let template = await tx.businessTemplate.findUnique({
        where: { code: templateCode },
        include: {
          modules: true,
          roles: { include: { permissions: true } },
          dashboards: true,
          workflows: true,
        },
      });

      if (!template) {
        // Fallback to RETAIL template if the code was not matched
        template = await tx.businessTemplate.findUnique({
          where: { code: 'RETAIL' },
          include: {
            modules: true,
            roles: { include: { permissions: true } },
            dashboards: true,
            workflows: true,
          },
        });
      }

      // Link Tenant to Template
      if (template) {
        await tx.tenantTemplate.create({
          data: {
            tenantId: tenant.id,
            templateId: template.id,
          },
        });
      }

      // Seed Master Permissions if not present
      const defaultModules = [
        'crm', 'inventory', 'sales', 'pos', 'purchases', 'finance', 'projects', 'hr',
        'vehicles', 'measurements', 'production', 'installations', 'machines', 'maintenance',
        'teams', 'contracts', 'tasks'
      ];
      const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export', '*'];
      
      const expectedPermissions: { module: string; action: string; description: string }[] = [];
      for (const mod of defaultModules) {
        for (const act of actions) {
          expectedPermissions.push({
            module: mod,
            action: act,
            description: `Enables ${act} on ${mod} module.`,
          });
        }
      }

      await tx.permission.createMany({
        data: expectedPermissions,
        skipDuplicates: true,
      });

      const allPermissions = await tx.permission.findMany();
      const permissionsMap: { [key: string]: string } = {};
      for (const perm of allPermissions) {
        permissionsMap[`${perm.module}:${perm.action}`] = perm.id;
      }

      // Provision Roles & Permissions
      let ownerRoleId: string | null = null;
      if (template) {
        for (const tRole of template.roles) {
          const role = await tx.role.create({
            data: {
              tenantId: tenant.id,
              name: tRole.code,
              description: tRole.description,
              isCustom: false,
            },
          });

          if (tRole.code === 'OWNER') {
            ownerRoleId = role.id;
          }

          // Map permissions
          const rolePermissionsToCreate: { roleId: string; permissionId: string }[] = [];
          for (const tPerm of tRole.permissions) {
            if (tPerm.action === '*') {
              const matchedPerms = allPermissions.filter((p) => p.module === tPerm.module);
              for (const mp of matchedPerms) {
                rolePermissionsToCreate.push({
                  roleId: role.id,
                  permissionId: mp.id,
                });
              }
            } else {
              const permKey = `${tPerm.module}:${tPerm.action}`;
              const permId = permissionsMap[permKey];
              if (permId) {
                rolePermissionsToCreate.push({
                  roleId: role.id,
                  permissionId: permId,
                });
              }
            }
          }

          if (rolePermissionsToCreate.length > 0) {
            await tx.rolePermission.createMany({
              data: rolePermissionsToCreate,
              skipDuplicates: true,
            });
          }
        }
      }

      // Associate Owner User to Owner Role
      if (ownerRoleId) {
        await tx.userRole.create({
          data: {
            userId: ownerUser.id,
            roleId: ownerRoleId,
          },
        });
      }

      // Enable Modules based on the template
      if (template) {
        const tenantModulesToEnable = template.modules.map((m) => ({
          tenantId: tenant.id,
          moduleId: m.moduleId,
          isEnabled: true,
        }));
        await tx.tenantModule.createMany({ data: tenantModulesToEnable });
      }

      // Provision Dashboards
      if (template) {
        const dashboardWidgetsToCreate = template.dashboards.map((dash) => ({
          tenantId: tenant.id,
          userId: ownerUser.id,
          widgetCode: dash.widgetCode,
          widgetName: dash.widgetName,
          gridPos: dash.gridPos || {},
          isVisible: true,
        }));
        if (dashboardWidgetsToCreate.length > 0) {
          await tx.tenantDashboardWidget.createMany({ data: dashboardWidgetsToCreate });
        }
      }

      // Provision Workflows
      if (template && template.workflows.length > 0) {
        const workflowStatesToCreate = template.workflows.map((wf) => ({
          tenantId: tenant.id,
          entityType: wf.entityType,
          stateCode: wf.stateCode,
          stateName: wf.stateName,
          sortOrder: wf.sortOrder,
          isInitial: wf.isInitial,
          isFinal: wf.isFinal,
        }));
        await tx.tenantWorkflowState.createMany({ data: workflowStatesToCreate });

        // Generate transitions automatically based on sortOrder
        const entityTypes = [...new Set(template.workflows.map((wf) => wf.entityType))];
        for (const type of entityTypes) {
          const typeStates = template.workflows
            .filter((wf) => wf.entityType === type)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          
          const dbStates = await tx.tenantWorkflowState.findMany({
            where: { tenantId: tenant.id, entityType: type },
          });
          const dbStatesMap: { [key: string]: string } = {};
          for (const s of dbStates) {
            dbStatesMap[s.stateCode] = s.id;
          }

          const transitionsToCreate: { tenantId: string; entityType: string; fromStateId: string; toStateId: string }[] = [];
          for (let i = 0; i < typeStates.length - 1; i++) {
            const fromStateId = dbStatesMap[typeStates[i].stateCode];
            const toStateId = dbStatesMap[typeStates[i + 1].stateCode];
            if (fromStateId && toStateId) {
              transitionsToCreate.push({
                tenantId: tenant.id,
                entityType: type,
                fromStateId,
                toStateId,
              });
            }
          }
          if (transitionsToCreate.length > 0) {
            await tx.tenantWorkflowTransition.createMany({ data: transitionsToCreate });
          }
        }
      }

      return ownerUser;
    }, {
      timeout: 30000 // 30 seconds
    });
  }

  /**
   * Retrieves organization details.
   */
  async getProfile(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        tenantModules: true,
        dashboardWidgets: true,
        workflowStates: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
    });
    if (!tenant) throw new NotFoundException('Organization not found.');
    return tenant;
  }

  /**
   * Updates organization profile.
   */
  async updateProfile(tenantId: string, updateDto: UpdateOrganizationDto) {
    return this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: updateDto.name,
        industryType: updateDto.industry,
        customDomain: updateDto.logo, // Placeholder mapping or extension
        currency: updateDto.currency,
      },
    });
  }

  /**
   * Invites a new member to the organization.
   */
  async inviteMember(tenantId: string, inviteDto: InviteMemberDto) {
    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 48 * 24 * 60 * 60 * 1000); // 48 hours expiration

    const invitation = await this.prisma.invitation.create({
      data: {
        tenantId,
        email: inviteDto.email,
        role: inviteDto.role.toUpperCase(),
        token,
        expiresAt,
      },
    });

    // In production, this would trigger an email containing link: /accept-invite?token=xxx
    return { success: true, token: invitation.token };
  }

  /**
   * Retrieves list of active users.
   */
  async getMembers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { tenantId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
        roles: { include: { role: true } },
      },
    });
  }

  async bootstrapTemplateForTenant(tenantId: string, templateCode: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException('Tenant not found.');

    let template = await this.prisma.businessTemplate.findUnique({
      where: { code: templateCode.toUpperCase() },
      include: {
        modules: true,
        roles: { include: { permissions: true } },
        dashboards: true,
        workflows: true,
      },
    });
    if (!template) {
      throw new NotFoundException(`Business template ${templateCode} not found.`);
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Clear existing template relations, workflow states, transitions, dashboards, custom roles, tenant modules
      await tx.tenantWorkflowTransition.deleteMany({ where: { tenantId } });
      await tx.tenantWorkflowState.deleteMany({ where: { tenantId } });
      await tx.tenantDashboardWidget.deleteMany({ where: { tenantId } });
      await tx.tenantModule.deleteMany({ where: { tenantId } });
      await tx.tenantTemplate.deleteMany({ where: { tenantId } });

      const roles = await tx.role.findMany({ where: { tenantId } });
      for (const r of roles) {
        await tx.rolePermission.deleteMany({ where: { roleId: r.id } });
        await tx.userRole.deleteMany({ where: { roleId: r.id } });
      }
      await tx.role.deleteMany({ where: { tenantId } });

      // 2. Link Tenant to Template
      await tx.tenantTemplate.create({
        data: {
          tenantId,
          templateId: template.id,
        },
      });

      // 3. Seed Master Permissions if not present
      const defaultModules = [
        'crm', 'inventory', 'sales', 'pos', 'purchases', 'finance', 'projects', 'hr',
        'vehicles', 'measurements', 'production', 'installations', 'machines', 'maintenance',
        'teams', 'contracts', 'tasks'
      ];
      const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export', '*'];
      const expectedPermissions: { module: string; action: string; description: string }[] = [];
      for (const mod of defaultModules) {
        for (const act of actions) {
          expectedPermissions.push({
            module: mod,
            action: act,
            description: `Enables ${act} on ${mod} module.`,
          });
        }
      }
      await tx.permission.createMany({
        data: expectedPermissions,
        skipDuplicates: true,
      });

      const allPermissions = await tx.permission.findMany();
      const permissionsMap: { [key: string]: string } = {};
      for (const perm of allPermissions) {
        permissionsMap[`${perm.module}:${perm.action}`] = perm.id;
      }

      // 4. Provision Roles & Permissions
      let ownerRoleId: string | null = null;
      for (const tRole of template.roles) {
        const role = await tx.role.create({
          data: {
            tenantId,
            name: tRole.code,
            description: tRole.description,
            isCustom: false,
          },
        });

        if (tRole.code === 'OWNER') {
          ownerRoleId = role.id;
        }

        const rolePermissionsToCreate: { roleId: string; permissionId: string }[] = [];
        for (const tPerm of tRole.permissions) {
          if (tPerm.action === '*') {
            const matchedPerms = allPermissions.filter((p) => p.module === tPerm.module);
            for (const mp of matchedPerms) {
              rolePermissionsToCreate.push({
                roleId: role.id,
                permissionId: mp.id,
              });
            }
          } else {
            const permKey = `${tPerm.module}:${tPerm.action}`;
            const permId = permissionsMap[permKey];
            if (permId) {
              rolePermissionsToCreate.push({
                roleId: role.id,
                permissionId: permId,
              });
            }
          }
        }

        if (rolePermissionsToCreate.length > 0) {
          await tx.rolePermission.createMany({
            data: rolePermissionsToCreate,
            skipDuplicates: true,
          });
        }
      }

      // 5. Associate Owner User to Owner Role if owner role exists and user exists
      const ownerUser = await tx.user.findFirst({ where: { tenantId } });
      if (ownerUser && ownerRoleId) {
        await tx.userRole.deleteMany({ where: { userId: ownerUser.id } });
        await tx.userRole.create({
          data: {
            userId: ownerUser.id,
            roleId: ownerRoleId,
          },
        });
      }

      // 6. Enable Modules
      const tenantModulesToEnable = template.modules.map((m) => ({
        tenantId,
        moduleId: m.moduleId,
        isEnabled: true,
      }));
      await tx.tenantModule.createMany({ data: tenantModulesToEnable });

      // 7. Provision Dashboards
      if (ownerUser) {
        const dashboardWidgetsToCreate = template.dashboards.map((dash) => ({
          tenantId,
          userId: ownerUser.id,
          widgetCode: dash.widgetCode,
          widgetName: dash.widgetName,
          gridPos: dash.gridPos || {},
          isVisible: true,
        }));
        if (dashboardWidgetsToCreate.length > 0) {
          await tx.tenantDashboardWidget.createMany({ data: dashboardWidgetsToCreate });
        }
      }

      // 8. Provision Workflows
      if (template.workflows.length > 0) {
        const workflowStatesToCreate = template.workflows.map((wf) => ({
          tenantId,
          entityType: wf.entityType,
          stateCode: wf.stateCode,
          stateName: wf.stateName,
          sortOrder: wf.sortOrder,
          isInitial: wf.isInitial,
          isFinal: wf.isFinal,
        }));
        await tx.tenantWorkflowState.createMany({ data: workflowStatesToCreate });

        const entityTypes = [...new Set(template.workflows.map((wf) => wf.entityType))];
        for (const type of entityTypes) {
          const typeStates = template.workflows
            .filter((wf) => wf.entityType === type)
            .sort((a, b) => a.sortOrder - b.sortOrder);
          
          const dbStates = await tx.tenantWorkflowState.findMany({
            where: { tenantId, entityType: type },
          });
          const dbStatesMap: { [key: string]: string } = {};
          for (const s of dbStates) {
            dbStatesMap[s.stateCode] = s.id;
          }

          const transitionsToCreate: { tenantId: string; entityType: string; fromStateId: string; toStateId: string }[] = [];
          for (let i = 0; i < typeStates.length - 1; i++) {
            const fromStateId = dbStatesMap[typeStates[i].stateCode];
            const toStateId = dbStatesMap[typeStates[i + 1].stateCode];
            if (fromStateId && toStateId) {
              transitionsToCreate.push({
                tenantId,
                entityType: type,
                fromStateId,
                toStateId,
              });
            }
          }
          if (transitionsToCreate.length > 0) {
            await tx.tenantWorkflowTransition.createMany({ data: transitionsToCreate });
          }
        }
      }

      return { success: true };
    });
  }

  async getTemplates() {
    return this.prisma.businessTemplate.findMany({
      include: {
        modules: true,
        roles: { include: { permissions: true } },
        dashboards: true,
        workflows: true,
      },
    });
  }
}
