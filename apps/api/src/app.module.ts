import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantContextMiddleware } from './common/middleware/tenant-context.middleware';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { ModuleEngineModule } from './modules/module-engine/module-engine.module';
import { SubscriptionModule } from './modules/subscription/subscription.module';
import { AuditModule } from './modules/audit/audit.module';
import { CustomerModule } from './modules/customer/customer.module';
import { ProductModule } from './modules/product/product.module';
import { WarehouseModule } from './modules/warehouse/warehouse.module';
import { InvoiceModule } from './modules/invoice/invoice.module';
import { ExpenseModule } from './modules/expense/expense.module';
import { AccountingModule } from './modules/accounting/accounting.module';

@Module({
  imports: [
    PrismaModule,
    TenantModule,
    AuthModule,
    RbacModule,
    ModuleEngineModule,
    SubscriptionModule,
    AuditModule,
    CustomerModule,
    ProductModule,
    WarehouseModule,
    InvoiceModule,
    ExpenseModule,
    AccountingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantContextMiddleware)
      .forRoutes('*');
  }
}
