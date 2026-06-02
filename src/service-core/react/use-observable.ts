"use client";

import { useLatest } from "ahooks";
import { useEffect, useRef } from "react";
import { useSyncExternalStore } from "react";
import type { Observable } from "rxjs";
import { merge } from "rxjs";

function toSource<T>(observable: Observable<T> | Observable<T>[]): Observable<T> {
  return Array.isArray(observable) ? merge(...observable) : observable;
}

export function useObservable<T>(observable: Observable<T> | Observable<T>[], callback: (value: T) => void): void {
  const latestCallback = useLatest(callback);
  const deps = Array.isArray(observable) ? observable : [observable];

  useEffect(() => {
    const sub = toSource(observable).subscribe((value) => latestCallback.current(value));
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/**
 * 浅比较函数：比较两个对象的第一层属性
 * 对 Map/Set/Date 等内置类型做特判，避免 Object.keys 遗漏内部状态导致误判相等
 */
function shallowEqual<T>(objA: T, objB: T): boolean {
  if (Object.is(objA, objB)) return true;

  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }

  // 类型不一致直接不等（Map vs Set, Date vs Object 等）
  if (objA.constructor !== objB.constructor) return false;

  // Map：逐个键值对 Object.is 比较
  if (objA instanceof Map && objB instanceof Map) {
    if (objA.size !== objB.size) return false;
    for (const [key, val] of objA) {
      if (!objB.has(key) || !Object.is(val, objB.get(key))) return false;
    }
    return true;
  }

  // Set：逐个元素 Object.is 比较
  if (objA instanceof Set && objB instanceof Set) {
    if (objA.size !== objB.size) return false;
    for (const item of objA) {
      if (!objB.has(item)) return false;
    }
    return true;
  }

  // Date：比较时间戳
  if (objA instanceof Date && objB instanceof Date) {
    return objA.getTime() === objB.getTime();
  }

  // 普通对象/数组：逐键 Object.is 比较
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key) || !Object.is((objA as Record<string, unknown>)[key], (objB as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}

/**
 * 读取 Observable 状态，驱动组件渲染。
 *
 * @param observable - 要订阅的 Observable 或 Observable 数组
 * @param getter - 获取当前值的函数，应仅依赖 observable 所关联的数据源
 *
 * @warning getter 仅在 observable 发射事件时被调用，不会被 React 同步求值。
 * 因此 getter 中依赖的外部状态（如 React useState）变更时不会触发更新。
 *
 * @example 组合 observable 状态与外部状态：
 * ```ts
 * const data = useObservableState(service.data$, () => service.data);
 * const combined = useMemo(() => data.map(…), [data, externalState]);
 * ```
 */
export function useObservableState<T>(observable: Observable<unknown> | Observable<unknown>[], getter: () => T): T {
  const latestGetter = useLatest(getter);
  const snapshotRef = useRef<T>(getter());

  return useSyncExternalStore(
    (notify) => {
      const sub = toSource(observable).subscribe(() => {
        const nextValue = latestGetter.current();
        const prevValue = snapshotRef.current;

        // 浅比较：如果值没变，不触发重渲染
        if (!shallowEqual(nextValue, prevValue)) {
          snapshotRef.current = nextValue;
          notify();
        }
      });
      return () => sub.unsubscribe();
    },
    () => snapshotRef.current,
    () => snapshotRef.current,
  );
}
