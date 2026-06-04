"use client";

import { useCallback } from "react";

import { useService } from "@/service-core";

import { NumberOrchestrationService } from "../../_service/number-orchestration.service";
import { ControlButtons } from "./control-buttons";
import { DerivedCard } from "./derived-card";
import { SourceCard } from "./source-card";
import styles from "./styles.module.scss";

/**
 * 编排层 — 获取 Service 实例，提供稳定回调，渲染 memo 子组件
 *
 * React 优化效果：
 * - SourceCard / DerivedCard 各自独立订阅，仅在自己关注的流发射时重渲染
 * - ControlButtons 接收稳定 useCallback 引用，永不重渲染
 * - 父级重新渲染时，memo 子组件自动跳过
 */
export default function NumberDemo() {
  const svc = useService(NumberOrchestrationService);

  const increment = useCallback(() => svc.increment(), [svc]);
  const decrement = useCallback(() => svc.decrement(), [svc]);
  const reset = useCallback(() => svc.reset(), [svc]);

  return (
    <div className={styles.demo}>
      <p className={styles.hint}>
        点击按钮 → <code>_number$.next(n)</code> 更新源流 → <code>square$</code> 自动派生新值
      </p>

      <div className={styles.flow}>
        <SourceCard />
        <span className={styles.arrow}>&rarr;</span>
        <DerivedCard />
      </div>

      <ControlButtons onDecrement={decrement} onIncrement={increment} onReset={reset} />
    </div>
  );
}
