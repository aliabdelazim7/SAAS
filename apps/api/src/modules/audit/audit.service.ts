import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Logs a state mutation to the database.
   */
  async logAction(data: {
    tenantId: string;
    userId?: string;
    action: string;
    details?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress: string;
    userAgent: string;
  }) {
    // Uses the tenantClient to comply with tenant isolation policies
    await this.prisma.tenantClient.auditLog.create({
      data: {
        tenantId: data.tenantId,
        userId: data.userId || null,
        action: data.action,
        details: data.details || null,
        oldValue: data.oldValue || null,
        newValue: data.newValue || null,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
      },
    });
  }
}
