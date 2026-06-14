"use client";

import { useLatest } from "ahooks";
import { useEffect, useRef, useSyncExternalStore } from "react";
import type { ObservableInput } from "rxjs";
import { distinctUntilChanged, from, map, tap } from "rxjs";

import { shallowEqual } from "@/shared/utils/object";

type ObservableSource<T> = ObservableInput<T> | (() => ObservableInput<T>);

function resolveSource<T>(source: ObservableSource<T>): ObservableInput<T> {
  return typeof source === "function" ? source() : source;
}

/**
 * 订阅一个流，并在每次发射时执行回调。
 *
 * 语义约束：
 * - mount-only：只在组件首次挂载时建立订阅
 * - `source` 不做 React 依赖追踪，调用方负责提供稳定的流或稳定的懒函数
 * - 如果需要切换订阅源，请通过组件重挂载，或在外层先用 RxJS 编排出稳定流
 *
 * 适用场景：
 * - 事件流消费
 * - 命令流派发
 * - 已通过 `merge` / `concat` / `switchMap` 等编排好的稳定流
 *
 * @param source - 单个 ObservableInput，或返回 ObservableInput 的懒函数
 * @param callback - 每次流发射时执行的回调
 */
export function useObservable<T>(source: ObservableSource<T>, callback: (value: T) => void): void {
  const latestSource = useLatest(source);
  const latestCallback = useLatest(callback);

  useEffect(() => {
    const sub = from(resolveSource(latestSource.current)).subscribe((value) => latestCallback.current(value));
    return () => sub.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * 读取单个 ObservableInput 对应的状态，并驱动组件渲染。
 *
 * 语义约束：
 * - 只接受单个 ObservableInput，或返回 ObservableInput 的懒函数
 * - hook 内部不做流合并，组合逻辑应由外层 RxJS 完成
 * - getter 只会在 observable 发射时被调用
 *
 * 适用场景：
 * - 多个 service 已在外层组合成一个稳定流
 * - 组件只关心当前快照，不关心流如何编排
 *
 * @param observable - 要订阅的单个 ObservableInput，或返回它的懒函数
 * @param getter - 获取当前值的函数，应该仅依赖 observable 所关联的数据源
 *
 * @warning getter 仅在 observable 发射事件时被调用，不会被 React 同步求值。
 * 因此 getter 中依赖的外部状态（如 React useState）变化时不会触发更新。
 *
 * @example
 * ```ts
 * const data = useObservableState(service.data$, () => service.data);
 * const combined = useMemo(() => data.map(...), [data, externalState]);
 * ```
 */
export function useObservableState<T>(observable: ObservableSource<unknown>, getter: () => T): T {
  const latestSource = useLatest(observable);
  const latestGetter = useLatest(getter);
  const snapshotRef = useRef<T>(getter());

  return useSyncExternalStore(
    (notify) => {
      const sub = from(resolveSource(latestSource.current))
        .pipe(
          map(() => latestGetter.current()),
          distinctUntilChanged(shallowEqual),
          tap((nextValue) => {
            snapshotRef.current = nextValue;
          }),
        )
        .subscribe(() => {
          notify();
        });
      return () => sub.unsubscribe();
    },
    () => snapshotRef.current,
    () => snapshotRef.current,
  );
}
