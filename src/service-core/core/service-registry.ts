import type { BaseService } from "./base-service";
import type { InjectionToken } from "./create-token";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Token = (abstract new (...args: any[]) => any) | symbol;

function tokenName(token: Token): string {
  return typeof token === "function" ? token.name : String(token);
}

/**
 * 带 parent 链的服务注册表
 *
 * - 子 registry 通过 parent 自动回溯：has / resolve 在当前层找不到时，继续向上查找
 * - register 时若父链已存在同 token，则跳过注册以保持单例（由父层持有实例）
 * - forEach 仅遍历本层实例，生命周期由各层 Provider 各自驱动，避免父层被重复触发
 */
export class ServiceRegistry {
  private _instances = new Map<Token, unknown>();

  constructor(private readonly _parent: ServiceRegistry | null = null) {}

  /** 父级 registry（无则为 null） */
  get parent(): ServiceRegistry | null {
    return this._parent;
  }

  register<T>(token: InjectionToken<T>, factory: (registry: ServiceRegistry) => T): this;
  register<T>(token: Token, factory: (registry: ServiceRegistry) => T): this;
  register<T>(token: Token, factory: (registry: ServiceRegistry) => T): this {
    // 父链已存在 → 跳过，确保单例由父层持有
    if (this._parent?.has(token)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[ServiceRegistry] Skip register "${tokenName(token)}": already registered in parent registry (singleton preserved).`);
      }
      return this;
    }
    // 本层重复注册 → 跳过
    if (this._instances.has(token)) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(`[ServiceRegistry] Duplicate register "${tokenName(token)}" in current registry.`);
      }
      return this;
    }
    this._instances.set(token, factory(this));
    return this;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  has(token: InjectionToken<any>): boolean;
  has(token: Token): boolean;
  has(token: Token): boolean {
    return this._instances.has(token) || (this._parent?.has(token) ?? false);
  }

  resolve<T>(token: InjectionToken<T>): T;
  resolve<T>(token: Token): T;
  resolve<T>(token: Token): T {
    if (this._instances.has(token)) return this._instances.get(token) as T;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (this._parent) return this._parent.resolve<T>(token as any);
    throw new Error(`[ServiceRegistry] Not registered: ${tokenName(token)}`);
  }

  /** 仅遍历本层 BaseService 实例，避免父层服务的生命周期被重复触发 */
  forEach(fn: (service: BaseService) => void): void {
    this._instances.forEach((instance) => {
      if (instance) {
        fn(instance as BaseService);
      }
    });
  }
}
