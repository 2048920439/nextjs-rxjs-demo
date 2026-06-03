import { debounce, type DebouncedFunc } from "lodash";
import { BehaviorSubject } from "rxjs";

import type { PersistCacheOptions } from "@/service-core/core/persist-cache";
import { PersistCache } from "@/service-core/core/persist-cache";
import type { Serializable } from "@/shared/utils/serializer";

/**
 * 自动持久化的 BehaviorSubject
 *
 * - 重写 `next()`，写值时通过 PersistCache 自动持久化到 localStorage
 * - `rehydrate()` 从缓存恢复数据
 * - `clearStorage()` 清除缓存
 * - 通过 `cache` 属性可直接访问底层 PersistCache 进行高级操作
 *
 * @example
 * ```ts
 * const subject$ = new PersistSubject(0, { key: 'my_counter' });
 * subject$.rehydrate(); // 从 localStorage 恢复
 * subject$.next(42);    // 自动持久化
 * subject$.clearStorage(); // 清除缓存
 * ```
 */
export class PersistSubject<T extends Serializable> extends BehaviorSubject<T> {
  readonly cache: PersistCache<T>;
  private readonly _debouncedPersist: DebouncedFunc<(value: T) => void>;

  constructor(initial: T, opt: PersistCacheOptions<T>) {
    super(initial);
    this.cache = new PersistCache<T>(opt);
    this._debouncedPersist = debounce((value: T) => this.cache.set(value), 1000);
  }

  /** 重写 next，写入值的同时经 1s 防抖后持久化，避免高频同步写盘阻塞主线程 */
  override next(value: T): void {
    super.next(value);
    this._debouncedPersist(value);
  }

  /** 从缓存恢复数据（序列化/反序列化 + TTL + check 校验均由 PersistCache 内部处理） */
  rehydrate(): void {
    try {
      const parsed = this.cache.get();
      if (parsed == null) return;
      super.next(parsed);
    } catch {
      // 恢复失败静默忽略
    }
  }

  /** 清除缓存 */
  clearStorage(): void {
    this.cache.remove();
  }
}
