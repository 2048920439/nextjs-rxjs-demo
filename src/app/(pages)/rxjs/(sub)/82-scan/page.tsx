"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { ScanDemoModel } from "./scan-demo.model";

// sidebar-title: 8.6.1 scan：持续输出累计状态

const BOOK_CODE = `// 8.6.1 scan
import { interval, scan, take } from "rxjs";

const source$ = interval(1000).pipe(take(5));
const result$ = source$.pipe(
  scan((accumulation, value) => accumulation + value, 0),
);

result$.subscribe(console.log);
// 0, 1, 3, 6, 10`;

const STATE_CODE = `// scan 很适合维护应用状态
import { scan } from "rxjs";

const state$ = action$.pipe(
  scan(
    (state, action) => reducer(state, action),
    initialState,
  ),
);

state$.subscribe(render);`;

export default function ScanPage() {
  const [demo] = useState(() => new ScanDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>8.6.1 scan：持续输出累计状态</h1>
        <p className={styles.subtitle}>
          scan 和 reduce 都会把多个上游值规约到一个累计值里；区别是 scan 每处理一个 next 就输出一次中间状态，所以它可以用来维护持续变化的应用状态。
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
            <code>{"cartAction$.pipe(scan((state, action) => reducer(state, action), seed))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>cartAction$</h3>
              <p className={styles.cardMeta}>每 1000ms 发出一次购物车变更，正数表示加入，负数表示移除</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 action 发出</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.label}-${item.at}`} className={clsx(styles.token, item.amount >= 0 ? styles.passToken : styles.pendingToken)}>
                      {item.amount >= 0 ? `+${item.amount}` : item.amount}
                      <small>{item.label}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>state$</h3>
              <p className={styles.cardMeta}>scan 每次都输出新的累计状态，不需要等待上游 complete</p>
              <div className={styles.outputList}>
                {state.snapshots.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 scan 输出状态"}</span>
                ) : (
                  state.snapshots.map((snapshot) => (
                    <div key={`${snapshot.count}-${snapshot.at}`} className={styles.outputLine}>
                      <strong>{`total ${snapshot.total}`}</strong>
                      <span>{`${snapshot.label} / ${snapshot.at}`}</span>
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
            <strong>每步都输出</strong>：scan 会把每次规约后的累计值立刻推给下游。
          </li>
          <li>
            <strong>内置状态</strong>：上一次返回值会成为下一次 reducer 的 accumulation。
          </li>
          <li>
            <strong>区别于 reduce</strong>：reduce 等 complete 后只输出最终结果，scan 适合持续状态流。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="用 scan 维护应用状态" code={STATE_CODE} />
    </div>
  );
}
