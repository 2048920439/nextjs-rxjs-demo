"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { MergeAllDemoModel, type MergeAllInnerId } from "./merge-all-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 5.2.2 mergeAll：并行摊平高阶 Observable

const INNER_CARDS: { inner: MergeAllInnerId; title: string; note: string }[] = [
  {
    inner: "inner0",
    title: "inner0$",
    note: "ho$ 第一次产生，mergeAll 立刻订阅",
  },
  {
    inner: "inner1",
    title: "inner1$",
    note: "ho$ 第二次产生，也会立刻订阅，不等待 inner0$ 完成",
  },
];

const BOOK_CODE = `// 5.2.2 mergeAll：并行摊平高阶 Observable
import { interval, map, mergeAll, take } from "rxjs";

const ho$ = interval(1000).pipe(
  take(2),
  map((x) =>
    interval(1500).pipe(
      map((y) => \`\${x}:\${y}\`),
      take(2),
    ),
  ),
);

const merged$ = ho$.pipe(mergeAll());`;

const COMPARE_CODE = `// mergeAll 的订阅策略：
// 1. ho$ 每产生一个内部 Observable
// 2. mergeAll 就立刻订阅它
// 3. 多个内部 Observable 可以同时活跃
// 4. 下游输出顺序由内部值的实际到达时间决定`;

export default function MergeAllPage() {
  const [demo] = useState(() => new MergeAllDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.2.2 mergeAll：并行摊平高阶 Observable</h1>
        <p className={styles.subtitle}>
          mergeAll 处理的也是高阶 Observable。和 concatAll 不同，它不会等前一个内部流完成；只要 ho$ 发出新的内部 Observable，mergeAll 就会订阅并并行转发。
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
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.outputs.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.outerBox}>
            <div>
              <h3 className={styles.cardTitle}>ho$</h3>
              <p className={styles.cardMeta}>每 500ms 产生一个内部 Observable，一共产生 2 个</p>
            </div>
            <div className={styles.tokenRow}>
              {state.outerValues.length === 0 ? (
                <span className={styles.empty}>等待产生内部 Observable</span>
              ) : (
                state.outerValues.map((value) => (
                  <span key={value} className={styles.outerToken}>
                    {value}
                  </span>
                ))
              )}
            </div>
          </div>

          <div className={styles.grid}>
            {INNER_CARDS.map((card) => {
              const isActive = state.activeInners.includes(card.inner);
              const isCompleted = state.completedInners.includes(card.inner);

              return (
                <article
                  key={card.inner}
                  className={clsx(styles.card, styles[`${card.inner}Card`], {
                    [styles.activeCard]: isActive,
                  })}
                >
                  <div className={styles.cardTop}>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    <span className={styles.cardMeta}>{card.note}</span>
                  </div>
                  <div className={styles.badgeRow}>
                    <span className={styles.badge}>{isActive ? "活跃中" : isCompleted ? "已完成" : "未订阅"}</span>
                    <span className={styles.badge}>输出 {state.outputsByInner[card.inner].length}</span>
                  </div>
                  <div className={styles.tokenRow}>
                    {state.outputsByInner[card.inner].map((value) => (
                      <span key={value} className={styles.token}>
                        {value}
                      </span>
                    ))}
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>merged$ 输出</span>
              <span className={styles.outputMeta}>内部流重叠时会交叉输出</span>
            </div>

            {state.outputs.length === 0 ? (
              <p className={styles.placeholder}>{"// 运行后这里会显示 mergeAll 的 next 顺序"}</p>
            ) : (
              state.outputs.map((item, index) => (
                <div key={`${item.value}-${item.at}-${index}`} className={styles.outputLine}>
                  <span className={styles.streamTag}>{item.inner}$</span>
                  <span className={styles.outputValue}>{item.value}</span>
                  <span className={styles.outputTime}>{item.at}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>发现即订阅</strong>：ho$ 每吐出一个内部 Observable，mergeAll 就马上订阅。
          </li>
          <li>
            <strong>允许并行</strong>：多个内部 Observable 可以同时输出，下游会看到交叉结果。
          </li>
          <li>
            <strong>全部完成才结束</strong>：外层 ho$ 完成且所有已订阅的内部流完成后，merged$ 才 complete。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="订阅策略" code={COMPARE_CODE} />
    </div>
  );
}
