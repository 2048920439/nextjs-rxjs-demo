"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { IgnoreElementsDemoModel, type IgnoreElementsMode } from "./ignore-elements-demo.model";

// sidebar-title: 7.3.1 ignoreElements：忽略所有 next

const BOOK_CODE = `// 7.3.1 ignoreElements
import { ignoreElements, interval, take } from "rxjs";

const source$ = interval(1000).pipe(take(5));
const result$ = source$.pipe(ignoreElements());

result$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// 不输出任何 next，只输出 complete`;

const FILTER_CODE = `// ignoreElements 可以理解为永远返回 false 的 filter
source$.pipe(filter(() => false));`;

export default function IgnoreElementsPage() {
  const [demo] = useState(() => new IgnoreElementsDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: IgnoreElementsMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.3.1 ignoreElements：忽略所有 next</h1>
        <p className={styles.subtitle}>ignoreElements 会丢弃上游所有 next，但 complete 和 error 仍然会传到下游。它适合只关心任务是否结束或失败的场景。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("complete")} disabled={state.running}>
                complete
              </button>
              <button className={styles.primaryBtn} onClick={() => run("error")} disabled={state.running}>
                error
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>source$.pipe(ignoreElements())</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>next 会出现，但不会进入 result$</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={`${styles.token} ${styles.dropToken}`}>
                      {item.value}
                      <small>drop</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>没有 next，只保留终止信号</p>
              {state.signal ? (
                <div className={styles.outputLine}>
                  <strong>{state.signal.type}</strong>
                  <span>{`${state.signal.message} · ${state.signal.at}`}</span>
                </div>
              ) : (
                <p className={styles.empty}>{"// 等待 complete 或 error"}</p>
              )}
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>忽略数据</strong>：所有 next 都不会进入下游。
          </li>
          <li>
            <strong>保留终止信号</strong>：complete 和 error 仍然会传递。
          </li>
          <li>
            <strong>使用场景少</strong>：只有完全不关心数据本身时才合适。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="近似 filter 写法" code={FILTER_CODE} />
    </div>
  );
}
