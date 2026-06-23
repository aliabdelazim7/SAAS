import { Module, Global } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { SubscriptionStatusGuard } from './guards/subscription-status.guard';

@Global()
@Module({
  providers: [SubscriptionService, SubscriptionStatusGuard],
  exports: [SubscriptionService, SubscriptionStatusGuard],
})
export class SubscriptionModule {}
