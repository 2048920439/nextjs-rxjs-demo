"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { AuditTimeDemoModel } from "./audit-time-demo.model";

// sidebar-title: 7.2.2 auditTime：窗口末尾取最后值

const BOOK_CODE = `// 7.2.2 auditTime
import { auditTime, interval } from "rxjs";

const source$ = interval(1000);
const result$ = source$.pipe(auditTime(2000));

result$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// 输出：1, 3, 5...`;

const COMPARE_CODE = `// throttleTime 取窗口第一个值，auditTime 取窗口最后一个值
source$.pipe(throttleTime(2000)); // 0, 2, 4...
source$.pipe(auditTime(2000));    // 1, 3, 5...`;

export default function AuditTimePage() {
  const [demo] = useState(() => new AuditTimeDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.2.2 auditTime：窗口末尾取最后值</h1>
        <p className={styles.subtitle}>auditTime(duration) 由上游第一个值触发时间窗口，但它不会立刻输出这个值，而是在窗口结束时输出窗口内最后一个值。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={run} disabled={state.running}>
                {state.running ? "运行中..." : "运行演示"}
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>source$.pipe(auditTime(900))</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>窗口内新值会替换候选值；窗口结束才输出</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span
                      key={`${item.value}-${item.at}`}
                      className={clsx(
                        styles.token,
                        item.state === "passed" && styles.passToken,
                        item.state === "dropped" && styles.dropToken,
                        item.state === "pending" && styles.pendingToken,
                      )}
                    >
                      {item.value}
                      <small>{item.state}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>收到每个审计窗口的最后一个值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待窗口结束"}</span>
                ) : (
                  state.outputs.map((item) => (
                    <div key={`${item.value}-${item.at}`} className={styles.outputLine}>
                      <strong>{item.value}</strong>
                      <span>{item.at}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>由上游触发窗口</strong>：第一个上游值只负责开启审计窗口。
          </li>
          <li>
            <strong>取最后一个值</strong>：窗口内持续更新候选值，结束时才输出。
          </li>
          <li>
            <strong>不同于 sampleTime</strong>：auditTime 的窗口起点跟上游值有关。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="和 throttleTime 对比" code={COMPARE_CODE} />
    </div>
  );
}
