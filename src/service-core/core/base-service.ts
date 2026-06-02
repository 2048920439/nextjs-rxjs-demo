import type { PersistCacheOptions } from "./persist-cache";
import { PersistSubject } from "./persist-subject";

type voidFn = () => void;
export interface LifecycleHooks {
  onHydrate: (fn: voidFn) => void;
  /** 注册挂载回调 */
  onMount: (fn: voidFn) => void;
  /** 注册卸载回调 */
  onUnmount: (fn: void | voidFn) => void;
}

export abstract class BaseService {
  private readonly _persistSubjects: PersistSubject<unknown>[] = [];
  private _hydrateCallbacks: (() => void)[] = [];
  private _mountCallbacks: (() => void)[] = [];
  private _unmountCallbacks: (() => void)[] = [];

  protected constructor() {
    this.setup({
      onHydrate: (fn) => this._hydrateCallbacks.push(fn),
      onMount: (fn) => this._mountCallbacks.push(fn),
      onUnmount: (fn) => this._unmountCallbacks.push(fn as () => void),
    });
  }

  /** 子类覆写，集中管理生命周期回调 */
  protected setup(_hooks: LifecycleHooks): void {}

  /**
   * 创建自动持久化的 BehaviorSubject
   * - 调用 .next() 时自动写入 localStorage
   * - _mount() 时自动从 localStorage 恢复
   * - 可通过返回的 PersistSubject 调用 rehydrate() / clearStorage()
   * @param initial 初始值
   * @param opt 缓存配置（key 必填，ttl / check 可选）
   */
  protected createPersistSubject<T>(initial: T, opt: PersistCacheOptions<T>): PersistSubject<T> {
    const subject = new PersistSubject<T>(initial, opt);
    this._persistSubjects.push(subject as PersistSubject<unknown>);
    return subject;
  }

  _hydrate(): void {
    this._persistSubjects.forEach((s) => s.rehydrate());
    this._hydrateCallbacks.forEach((fn) => fn());
  }

  /** @internal 框架内部调用，先恢复持久化数据，再执行挂载回调 */
  _mount(): void {
    this._mountCallbacks.forEach((fn) => fn());
  }

  /** @internal 框架内部调用，执行卸载回调 */
  _unmount(): void {
    this._unmountCallbacks.forEach((fn) => fn());
  }
}
