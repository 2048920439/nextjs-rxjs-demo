"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { RetryWhenDemoModel } from "./retry-when-demo.model";

// sidebar-title: 9.3.3 retryWhen：用 notifier 控制重试

const BOOK_CODE = `// 9.3.3 retryWhen：延时重试
import { delay, map, retryWhen } from "rxjs";

const retry$ = source$.pipe(
  map(throwOnUnluckyNumber),
  retryWhen((err$) => err$.pipe(delay(1000))),
);`;

const LIMITED_CODE = `// 同时控制节奏和次数
import { catchError, delayWhen, of, scan, timer } from "rxjs";

const result$ = source$.pipe(
  map(throwOnUnluckyNumber),
  retryWhen((err$) =>
    err$.pipe(
      scan((count, err) => {
        if (count >= 2) throw err;
        return count + 1;
      }, 0),
      delayWhen((count) => timer(count * 1000)),
    ),
  ),
  catchError(() => of(8)),
);`;

export default function RetryWhenPage() {
  const [demo] = useState(() => new RetryWhenDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>9.3.3 retryWhen：用 notifier 控制重试</h1>
        <p className={styles.subtitle}>
          retryWhen 把错误流交给 notifier。notifier 每输出一次，retryWhen 就重新订阅上游；notifier 可以用 delay、scan、timer 等操作符控制重试节奏和上限。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={run} disabled={state.running}>
                运行
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{"retryWhen((err$) => err$.pipe(scan(count), delayWhen(timer)))"}</code>
          </div>

          <div className={styles.notifier}>
            <span>notifier</span>
            <strong>
              {state.retryEvents.length === 0
                ? "等待错误进入 err$"
                : state.retryEvents.map((item) => `retry ${item.retry} after ${item.delayMs}ms @ ${item.at}`).join(" / ")}
            </strong>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>每次重试都重新发出 1、2、3；4 抛错后交给 notifier 决定何时重试</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span
                      key={`${item.attempt}-${item.value}-${item.at}`}
                      className={clsx(styles.token, item.value === 4 ? styles.pendingToken : styles.passToken)}
                    >
                      {item.value}
                      <small>{`try ${item.attempt}`}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>两次延时重试后仍失败，最终由 catchError 输出恢复值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 retryWhen 输出"}</span>
                ) : (
                  state.outputs.map((item) => (
                    <div key={`${item.label}-${item.value}-${item.at}`} className={styles.outputLine}>
                      <strong>{item.kind === "recovery" ? `fallback ${item.value}` : `next ${item.value}`}</strong>
                      <span>{`${item.label} / ${item.at}`}</span>
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
            <strong>错误也是流</strong>：notifier 收到的是 err$，可以对错误次数做 scan。
          </li>
          <li>
            <strong>控制节奏</strong>：delayWhen + timer 能把立即重试改成延时重试。
          </li>
          <li>
            <strong>控制上限</strong>：到达上限后重新抛错，再交给 catchError 做恢复。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书延时重试的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="延时并有上限的重试" code={LIMITED_CODE} />
    </div>
  );
}
