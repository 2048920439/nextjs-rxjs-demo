"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { CountDemoModel } from "./count-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 6.1.1 count：统计数据个数

const BOOK_CODE = `// 6.1.1 count：统计数据个数
import { concat, count, of } from "rxjs";

const source$ = concat(of(1, 2, 3), of(4, 5, 6));
const count$ = source$.pipe(count());

count$.subscribe(console.log);

// 输出：6`;

const ASYNC_CODE = `// count 必须等上游 complete，延迟完结就会延迟输出
import { concat, count, timer } from "rxjs";

const source$ = concat(timer(1000), timer(1000));
const count$ = source$.pipe(count());

count$.subscribe(console.log);

// 约 2 秒后输出：2`;

export default function CountPage() {
  const [demo] = useState(() => new CountDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>6.1.1 count：统计数据个数</h1>
        <p className={styles.subtitle}>
          count 会遍历上游 Observable 发出的所有数据，但不会为每个数据都输出结果。它必须等上游 complete，才能知道总共有多少个值。
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

          <div className={styles.grid}>
            <article className={styles.card}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>source$</h3>
                <span className={styles.cardMeta}>先同步发出 1、2、3，再每 500ms 发出 4、5、6</span>
              </div>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={clsx(styles.token, item.phase === "async" && styles.asyncToken)}>
                      {item.value}
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={clsx(styles.card, styles.resultCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>source$.pipe(count())</h3>
                <span className={styles.cardMeta}>上游未完成前不会输出中间计数</span>
              </div>
              {state.result ? (
                <div className={styles.result}>
                  <span className={styles.resultValue}>{state.result.value}</span>
                  <span className={styles.resultMeta}>complete 后输出于 {state.result.at}</span>
                </div>
              ) : (
                <p className={styles.placeholder}>{"// 等待 source$ complete 后输出总数"}</p>
              )}
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>只输出一次</strong>：count 的结果是上游数据总数，不是持续变化的计数器。
          </li>
          <li>
            <strong>依赖 complete</strong>：上游不完结，count 就无法确认最终数量。
          </li>
          <li>
            <strong>可统计任意值</strong>：count 关心的是 next 的次数，不关心每个值本身是什么。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="异步完结时的 count" code={ASYNC_CODE} />
    </div>
  );
}
