"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { TakeLastDemoModel } from "./take-last-demo.model";

// sidebar-title: 7.1.4 takeLast：取最后 N 个值

const BOOK_CODE = `// 7.1.4 takeLast
import { of, takeLast } from "rxjs";

const source$ = of(3, 1, 4, 1, 5, 9);
const last3$ = source$.pipe(takeLast(3));

last3$.subscribe(console.log);

// 输出：1, 5, 9`;

const TIMING_CODE = `// takeLast 必须等上游 complete
import { interval, take, takeLast } from "rxjs";

const source$ = interval(1000).pipe(take(5));
const last3$ = source$.pipe(takeLast(3));

last3$.subscribe(console.log);

// source$ complete 后一次性输出：2, 3, 4`;

export default function TakeLastPage() {
  const [demo] = useState(() => new TakeLastDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.4 takeLast：取最后 N 个值</h1>
        <p className={styles.subtitle}>
          takeLast(count) 像可以获取多个值的 last。它需要等上游 complete，才能知道最后 count 个值是谁，因此不会实时转发上游 next。
        </p>
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
            <code>takeLast(3)</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>发出 0、1、2、3、4；takeLast 缓存最后 3 个候选值</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={styles.token}>
                      {item.value}
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>last3$</h3>
              <p className={styles.cardMeta}>complete 后才输出 2、3、4</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 source$ complete"}</span>
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
            <strong>必须等 complete</strong>：最后 N 个值只有在上游结束后才能确定。
          </li>
          <li>
            <strong>内部会缓存</strong>：只保留最后 count 个候选值。
          </li>
          <li>
            <strong>不适合无限流</strong>：上游永不 complete 时，takeLast 永远不会输出。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="异步流中的输出时机" code={TIMING_CODE} />
    </div>
  );
}
