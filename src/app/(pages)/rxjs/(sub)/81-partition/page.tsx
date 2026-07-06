"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { PartitionDemoModel } from "./partition-demo.model";

// sidebar-title: 8.5.2 partition：按条件一分为二

const BOOK_CODE = `// 8.5.2 partition
import { partition, share, take, timer } from "rxjs";

const source$ = timer(0, 1000).pipe(take(6), share());
const [even$, odd$] = partition(source$, (value) => value % 2 === 0);

even$.subscribe((value) => console.log("even:", value));
odd$.subscribe((value) => console.log("odd:", value));`;

const FILTER_CODE = `// partition 等价于一对互补 filter，但返回值是数组
import { filter } from "rxjs";

const even$ = source$.pipe(filter((value) => value % 2 === 0));
const odd$ = source$.pipe(filter((value) => value % 2 !== 0));`;

export default function PartitionPage() {
  const [demo] = useState(() => new PartitionDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  const evenBucket = state.buckets.find((bucket) => bucket.key === "even");
  const oddBucket = state.buckets.find((bucket) => bucket.key === "odd");

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>8.5.2 partition：按条件一分为二</h1>
        <p className={styles.subtitle}>
          partition 接收一个判定函数，把上游拆成两个 Observable：第一个收集满足条件的值，第二个收集不满足条件的值。它返回的是数组，不是可继续 pipe 的单个
          Observable。
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
            <code>{"const [even$, odd$] = partition(source$, (value) => value % 2 === 0)"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>0 到 5，每 1000ms 发出一个；predicate 为 true 时进入 even$</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={clsx(styles.token, item.key === "even" ? styles.passToken : styles.pendingToken)}>
                      {item.value}
                      <small>{item.key}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>[even$, odd$]</h3>
              <p className={styles.cardMeta}>partition 直接返回两个可分别订阅和处理的 Observable</p>
              <div className={styles.outputList}>
                <div className={styles.outputLine}>
                  <strong>{evenBucket?.label ?? "even$"}</strong>
                  <span>{evenBucket && evenBucket.values.length > 0 ? `[${evenBucket.values.join(", ")}]` : "// 等待偶数"}</span>
                </div>
                <div className={styles.outputLine}>
                  <strong>{oddBucket?.label ?? "odd$"}</strong>
                  <span>{oddBucket && oddBucket.values.length > 0 ? `[${oddBucket.values.join(", ")}]` : "// 等待奇数"}</span>
                </div>
              </div>
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>一分为二</strong>：第一个 Observable 对应 predicate 为 true，第二个对应 false。
          </li>
          <li>
            <strong>返回数组</strong>：使用时通常先解构，再分别处理两个结果流。
          </li>
          <li>
            <strong>适合二选一</strong>：只有两个固定分支时，partition 比 groupBy 更直接。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="和 filter 的对应关系" code={FILTER_CODE} />
    </div>
  );
}
