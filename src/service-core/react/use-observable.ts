"use client";

import { useLatest } from "ahooks";
import { useEffect, useRef } from "react";
import { useSyncExternalStore } from "react";
import type { Observable } from "rxjs";
import { merge } from "rxjs";

import { shallowEqual } from "@/shared/utils/object";

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
