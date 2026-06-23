import { SetMetadata } from '@nestjs/common';

export interface RequiredPermission {
  module: string;
  action: string;
}

export const RequirePermission = (module: string, action: string) =>
  SetMetadata('permission', { module, action });
