import type { Subscription } from "rxjs";

import type { PersistCacheOptions } from "@/service-core/core/persist-cache";
import { PersistSubject } from "@/service-core/core/persist-subject";
import type { Serializable } from "@/shared/utils/serializer";

import type { Effect } from "./effect";
import { registerEffects } from "./effect";

type voidFn = () => void;
export interface LifecycleHooks {
  onHydrate: (fn: voidFn) => void;
  /** 注册挂载回调 */
  onMount: (fn: voidFn) => void;
  /** 注册卸载回调 */
  onUnmount: (fn: void | voidFn) => void;
}

export abstract class BaseService {
  private readonly _persistSubjects: PersistSubject<Serializable>[] = [];
  private _hydrateCallbacks: (() => void)[] = [];
  private _mountCallbacks: (() => void)[] = [];
  private _unmountCallbacks: (() => void)[] = [];
  private _subscriptions: Subscription[] = [];

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
  protected createPersistSubject<T extends Serializable>(initial: T, opt: PersistCacheOptions<T>): PersistSubject<T> {
    const subject = new PersistSubject<T>(initial, opt);
    // _persistSubjects 仅用于批量 rehydrate()，不依赖具体 T，此处向上转型安全
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this._persistSubjects.push(subject as PersistSubject<any>);
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

  /**
   * 注册 Effects：立即启动订阅，并在 _unmount() 时自动取消。
   *
   * - ctx：独立的上下文对象（实现抽象接口，不暴露 Service 内部细节）
   * - effects：纯编排函数，通过 ctx 读取命令流、写入状态
   */
  protected registerEffects<T>(ctx: T, effects: Effect<T>[]): void {
    this._subscriptions.push(...registerEffects(ctx, effects));
  }

  /** @internal 框架内部调用，执行卸载回调并取消所有 effect 订阅 */
  _unmount(): void {
    this._unmountCallbacks.forEach((fn) => fn());
    this._subscriptions.forEach((s) => s.unsubscribe());
    this._subscriptions = [];
  }
}
