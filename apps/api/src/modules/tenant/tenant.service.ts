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

      // E. Seed Core Permissions
      const defaultModules = ['crm', 'inventory', 'sales', 'pos', 'purchases', 'finance', 'projects', 'hr'];
      const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
      
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

      // Bulk-create missing permissions in a single roundtrip
      await tx.permission.createMany({
        data: expectedPermissions,
        skipDuplicates: true,
      });

      // Retrieve all permissions in a single query
      const allPermissions = await tx.permission.findMany();
      const permissionsMap: { [key: string]: string } = {};
      for (const perm of allPermissions) {
        permissionsMap[`${perm.module}:${perm.action}`] = perm.id;
      }

      // F. Create Default Roles for this Tenant
      const ownerRole = await tx.role.create({
        data: { tenantId: tenant.id, name: 'OWNER', description: 'Complete system access' },
      });
      const adminRole = await tx.role.create({
        data: { tenantId: tenant.id, name: 'ADMIN', description: 'Store administrative access' },
      });
      const cashierRole = await tx.role.create({
        data: { tenantId: tenant.id, name: 'CASHIER', description: 'Access to POS screen checkout' },
      });

      // G. Map Permissions to Roles
      // Owner gets all permissions
      const ownerRolePermsData = Object.values(permissionsMap).map((permId) => ({
        roleId: ownerRole.id,
        permissionId: permId,
      }));
      await tx.rolePermission.createMany({ data: ownerRolePermsData });

      // Admin gets view, create, edit
      const adminPerms = Object.keys(permissionsMap)
        .filter((key) => key.endsWith(':view') || key.endsWith(':create') || key.endsWith(':edit'))
        .map((key) => ({ roleId: adminRole.id, permissionId: permissionsMap[key] }));
      await tx.rolePermission.createMany({ data: adminPerms });

      // Cashier gets view/create on sales & POS
      const cashierPerms = Object.keys(permissionsMap)
        .filter((key) => key.startsWith('sales:') || key.startsWith('pos:'))
        .filter((key) => key.endsWith(':view') || key.endsWith(':create'))
        .map((key) => ({ roleId: cashierRole.id, permissionId: permissionsMap[key] }));
      await tx.rolePermission.createMany({ data: cashierPerms });

      // H. Associate Owner User to Owner Role
      await tx.userRole.create({
        data: {
          userId: ownerUser.id,
          roleId: ownerRole.id,
        },
      });

      // I. Enable Default Modules based on pricing plan
      const planFeatures = plan.features as Record<string, boolean>;
      const tenantModulesToEnable = Object.keys(planFeatures)
        .filter((modKey) => planFeatures[modKey])
        .map((modKey) => ({
          tenantId: tenant.id,
          moduleId: modKey,
          isEnabled: true,
        }));
      
      await tx.tenantModule.createMany({ data: tenantModulesToEnable });

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
}
