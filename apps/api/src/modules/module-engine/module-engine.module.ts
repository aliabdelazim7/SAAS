import { Module, Global } from '@nestjs/common';
import { ModuleEngineService } from './module-engine.service';
import { ModuleEnabledGuard } from './guards/module-enabled.guard';

@Global()
@Module({
  providers: [ModuleEngineService, ModuleEnabledGuard],
  exports: [ModuleEngineService, ModuleEnabledGuard],
})
export class ModuleEngineModule {}
