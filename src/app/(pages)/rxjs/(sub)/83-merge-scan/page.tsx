"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { MergeScanDemoModel } from "./merge-scan-demo.model";

// sidebar-title: 8.6.2 mergeScan：异步累计数据

const BOOK_CODE = `// 8.6.2 mergeScan
import { interval, mergeScan, of, take } from "rxjs";

const source$ = interval(1000).pipe(take(5));
const result$ = source$.pipe(
  mergeScan((accumulation, value) => {
    return of(accumulation + value);
  }, 0),
);

result$.subscribe(console.log);
// 0, 1, 3, 6, 10`;

const LOAD_MORE_CODE = `// 无限列表：每次滚动到底部，请求下一页并合并到累计列表
const feed$ = scrollToEnd$.pipe(
  mergeScan((allItems) => {
    const cursor = allItems[allItems.length - 1]?.id;

    return getTweets(cursor).pipe(
      map((newItems) => allItems.concat(newItems)),
    );
  }, [], 1), // concurrent = 1，保证下一次请求使用上一次返回后的累计列表
);`;

export default function MergeScanPage() {
  const [demo] = useState(() => new MergeScanDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>8.6.2 mergeScan：异步累计数据</h1>
        <p className={styles.subtitle}>
          mergeScan 类似 scan，但 reducer 返回的是 Observable。它适合“当前累计结果决定下一次异步请求参数”的场景，例如无限滚动加载更多。
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
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.triggers.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{"scrollToEnd$.pipe(mergeScan((allItems) => getTweets$(cursor).pipe(map(concat)), [], 1))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>scrollToEnd$</h3>
              <p className={styles.cardMeta}>只表示“滚动到底部”这个触发事件；cursor 由 mergeScan 内部根据累计列表计算</p>
              <div className={styles.tokenRow}>
                {state.triggers.length === 0 ? (
                  <span className={styles.empty}>等待滚动到底部</span>
                ) : (
                  state.triggers.map((trigger) => (
                    <span key={`${trigger.request}-${trigger.at}`} className={`${styles.token} ${styles.passToken}`}>
                      load {trigger.request}
                      <small>{`cursor ${trigger.cursor}`}</small>
                      <small>{trigger.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>feed$</h3>
              <p className={styles.cardMeta}>getTweets$ 返回 batch；mergeScan 再输出合并后的累计列表</p>
              <div className={styles.outputList}>
                {state.batches.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 getTweets$ 返回 batch"}</span>
                ) : (
                  state.batches.map((batch) => (
                    <div key={`${batch.request}-${batch.at}`} className={styles.outputLine}>
                      <strong>{`batch ${batch.request}`}</strong>
                      <span>{`cursor ${batch.cursor} / +${batch.newItems.length} / total ${batch.total}`}</span>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.outputList}>
                {state.items.map((item) => (
                  <div key={item.id} className={styles.outputLine}>
                    <strong>{item.id}</strong>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>reducer 返回 Observable</strong>：异步请求返回的新数据会成为下一次累计的一部分。
          </li>
          <li>
            <strong>必须提供 seed</strong>：mergeScan 需要明确的初始累计值。
          </li>
          <li>
            <strong>控制并发</strong>：示例把并发设为 1，避免多次请求交叉导致累计值难以判断。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="加载更多场景中的 mergeScan" code={LOAD_MORE_CODE} />
    </div>
  );
}
