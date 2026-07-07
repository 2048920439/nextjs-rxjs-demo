"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { SchedulerRoleDemoModel, type SchedulerRoleLog, type SchedulerRoleMode } from "./scheduler-role-demo.model";

// sidebar-title: 11.1 Scheduler 的调度作用

const BOOK_CODE = `// 11.1 Scheduler 的调度作用：原书示例的 RxJS 7 写法
import { asapScheduler, observeOn, range } from "rxjs";

const source$ = range(1, 3);

console.log("before subscribe");
source$.subscribe({
  next: (value) => console.log("data:", value),
  error: (error) => console.log("error:", error),
  complete: () => console.log("complete"),
});
console.log("after subscribe");

// before subscribe
// data: 1
// data: 2
// data: 3
// complete
// after subscribe`;

const ASAP_CODE = `// RxJS 5: Observable.range(1, 3, asap)
// RxJS 7: 用 observeOn(asapScheduler) 表达同样的通知调度
import { asapScheduler, observeOn, range } from "rxjs";

const source$ = range(1, 3).pipe(observeOn(asapScheduler));

console.log("before subscribe");
source$.subscribe({
  next: (value) => console.log("data:", value),
  complete: () => console.log("complete"),
});
console.log("after subscribe");

// before subscribe
// after subscribe
// data: 1
// data: 2
// data: 3
// complete`;

const MODE_LABEL: Record<SchedulerRoleMode, string> = {
  sync: "range(1, 3)",
  asap: "observeOn(asapScheduler)",
};

function getLogClass(log: SchedulerRoleLog) {
  if (log.phase === "caller") return `${styles.token} ${styles.passToken}`;
  if (log.phase === "complete") return `${styles.token} ${styles.dropToken}`;
  return `${styles.token} ${styles.pendingToken}`;
}

export default function SchedulerRolePage() {
  const [demo] = useState(() => new SchedulerRoleDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: SchedulerRoleMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>11.1 Scheduler 的调度作用</h1>
        <p className={styles.subtitle}>
          这一节用 range 展示 scheduler 的核心价值：它不改变数据本身，而是改变 Observable 向 Observer 推送通知的时机。默认写法同步输出；加上 asapScheduler
          后，通知会让出当前调用栈。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("sync")} disabled={state.running}>
                同步
              </button>
              <button className={styles.primaryBtn} onClick={() => run("asap")} disabled={state.running}>
                asap
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.logs.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>source$</span>
            <code>{MODE_LABEL[state.mode]}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>调用顺序</h3>
              <p className={styles.cardMeta}>绿色是调用方 console.log，棕色是 Observer next，灰色是 complete。</p>
              <div className={styles.tokenRow}>
                {state.logs.length === 0 ? (
                  <span className={styles.empty}>等待运行示例</span>
                ) : (
                  state.logs.map((log) => (
                    <span key={`${log.order}-${log.text}`} className={getLogClass(log)}>
                      {log.order}
                      <small>{log.phase}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>console 输出</h3>
              <p className={styles.cardMeta}>重点看 after subscribe 出现的位置。</p>
              <div className={styles.outputList}>
                {state.logs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待输出"}</span>
                ) : (
                  state.logs.map((log) => (
                    <div key={`${log.order}-${log.at}`} className={styles.outputLine}>
                      <strong>{log.text}</strong>
                      <span>{log.at}</span>
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
            <strong>默认 range</strong>：subscribe 发生时立刻同步推送 1、2、3 和 complete。
          </li>
          <li>
            <strong>asapScheduler</strong>：把 Observer 通知安排到当前同步代码之后，所以 after subscribe 会先打印。
          </li>
          <li>
            <strong>RxJS 7 写法</strong>：优先使用 pipe + observeOn，而不是旧版创建函数的 scheduler 参数。
          </li>
        </ul>
      </aside>

      <CodeBlock title="默认同步输出" code={BOOK_CODE} />
      <CodeBlock title="使用 asapScheduler" code={ASAP_CODE} />
    </div>
  );
}
