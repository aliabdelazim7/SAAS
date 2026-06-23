import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves the active subscription status for a tenant.
   */
  async getSubscriptionStatus(tenantId: string): Promise<string> {
    const sub = await this.prisma.tenantClient.tenantSubscription.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      select: { status: true },
    });
    return sub?.status || 'INACTIVE';
  }

  /**
   * Validates if a tenant has exceeded their plan allocations before resource additions.
   */
  async validateLimits(tenantId: string, limitType: 'maxUsers' | 'maxWarehouses' | 'maxProducts'): Promise<boolean> {
    const sub = await this.prisma.tenantClient.tenantSubscription.findFirst({
      where: { tenantId, status: { in: ['ACTIVE', 'TRIALING'] } },
      include: { plan: true },
    });

    if (!sub) {
      throw new BadRequestException('Active subscription plan not found.');
    }

    const limit = sub.plan[limitType];
    let currentCount = 0;

    if (limitType === 'maxUsers') {
      currentCount = await this.prisma.tenantClient.user.count({ where: { tenantId } });
    } else if (limitType === 'maxWarehouses') {
      currentCount = await this.prisma.tenantClient.warehouse.count({ where: { tenantId } });
    } else if (limitType === 'maxProducts') {
      currentCount = await this.prisma.tenantClient.productVariant.count({ where: { tenantId } });
    }

    if (currentCount >= limit) {
      throw new BadRequestException(
        `Plan resource allocation limit reached for ${limitType}. Maximum allowed: ${limit}.`
      );
    }

    return true;
  }
}
