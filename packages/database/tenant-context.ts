import { AsyncLocalStorage } from 'async_hooks';

export interface TenantStore {
  tenantId: string;
  userId?: string;
}

export class TenantContext {
  private static storage = new AsyncLocalStorage<TenantStore>();

  static run<T>(store: TenantStore, callback: () => T): T {
    return this.storage.run(store, callback);
  }

  static getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }

  static getUserId(): string | undefined {
    return this.storage.getStore()?.userId;
  }

  static getStore(): TenantStore | undefined {
    return this.storage.getStore();
  }
}
