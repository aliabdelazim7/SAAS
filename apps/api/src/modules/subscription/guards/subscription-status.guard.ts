import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { SubscriptionService } from '../subscription.service';

@Injectable()
export class SubscriptionStatusGuard implements CanActivate {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.tenantId;

    // Bypass check for requests that are not tenant-scoped
    if (!tenantId) {
      return true;
    }

    const status = await this.subscriptionService.getSubscriptionStatus(tenantId);
    const allowedStatuses = ['ACTIVE', 'TRIALING'];

    if (!allowedStatuses.includes(status.toUpperCase())) {
      throw new HttpException(
        `Subscription status: ${status}. Please renew your subscription payment.`,
        HttpStatus.PAYMENT_REQUIRED
      );
    }

    return true;
  }
}
