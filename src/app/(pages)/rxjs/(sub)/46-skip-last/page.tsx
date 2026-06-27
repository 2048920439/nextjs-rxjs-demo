"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { SkipLastDemoModel } from "./skip-last-demo.model";

// sidebar-title: 7.1.6 skipLast：跳过最后 N 个值

const BOOK_CODE = `// skipLast：跳过最后 N 个值
import { of, skipLast } from "rxjs";

const source$ = of(0, 1, 2, 3, 4, 5);
const result$ = source$.pipe(skipLast(2));

result$.subscribe(console.log);

// 输出：0, 1, 2, 3`;

const TIMING_CODE = `// skipLast 需要缓存后续值才能确认当前值不是最后 N 个
import { interval, skipLast, take } from "rxjs";

const source$ = interval(1000).pipe(take(5));
const result$ = source$.pipe(skipLast(2));

result$.subscribe(console.log);

// 输出会滞后：0, 1, 2`;

export default function SkipLastPage() {
  const [demo] = useState(() => new SkipLastDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.6 skipLast：跳过最后 N 个值</h1>
        <p className={styles.subtitle}>
          skipLast(count) 会丢弃上游结束前的最后 count 个值。它必须缓存一段尾部候选值，因此实时流里输出会比上游发值慢 count 个位置。
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
            <code>skipLast(2)</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>发出 0 到 5；最后 4、5 不会进入下游</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={clsx(styles.token, item.pending ? styles.tailToken : styles.passToken)}>
                      {item.value}
                      <small>{item.pending ? "tail" : "seen"}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>只输出确认不是最后 2 个的值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待缓冲区填满"}</span>
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
            <strong>跳过尾部</strong>：最后 count 个值永远不会进入下游。
          </li>
          <li>
            <strong>输出会滞后</strong>：需要看到后续值，才能确认当前值不是尾部。
          </li>
          <li>
            <strong>上游要结束</strong>：上游 complete 后，缓冲区中的尾部值被丢弃。
          </li>
        </ul>
      </aside>

      <CodeBlock title="RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="异步流中的输出时机" code={TIMING_CODE} />
    </div>
  );
}
