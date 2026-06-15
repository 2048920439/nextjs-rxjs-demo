"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { CombineAllDemoModel, type CombineAllInnerId } from "./combine-all-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 5.2.2 combineAll：等待外层完成后组合最新值

const INNER_CARDS: { inner: CombineAllInnerId; title: string; note: string }[] = [
  {
    inner: "inner0",
    title: "inner0$",
    note: "第一个内部 Observable，后续值会刷新最新快照",
  },
  {
    inner: "inner1",
    title: "inner1$",
    note: "第二个内部 Observable，也必须先至少发出一个值",
  },
];

const BOOK_CODE = `// 5.2.2 combineAll：等待外层完成后组合最新值
import { combineAll, interval, map, take } from "rxjs";

const ho$ = interval(1000).pipe(
  take(2),
  map((x) =>
    interval(1500).pipe(
      map((y) => \`\${x}:\${y}\`),
      take(2),
    ),
  ),
);

const combined$ = ho$.pipe(combineAll());

// 输出：
// ["0:0", "1:0"]
// ["0:1", "1:0"]
// ["0:1", "1:1"]`;

const WAIT_CODE = `// combineAll 是书中的命名
// RxJS 7 中它仍可用，同时也是 combineLatestAll 的别名
//
// 它和 zipAll 一样需要先等 ho$ complete
// 然后等每个内部 Observable 至少发出一个值
// 之后任一内部流更新，都会重新组合全部最新值`;

export default function CombineAllPage() {
  const [demo] = useState(() => new CombineAllDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.2.2 combineAll：等待外层完成后组合最新值</h1>
        <p className={styles.subtitle}>
          combineAll 是高阶 Observable 版本的 combineLatest。它先等 ho$ complete 来确定输入集合，再等每个内部流都有最新值，之后任一内部值更新都会重新组合输出。
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
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.snapshots.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.outerBox}>
            <div>
              <h3 className={styles.cardTitle}>ho$</h3>
              <p className={styles.cardMeta}>先产生内部 Observable；complete 后 combineAll 才开始订阅它们</p>
            </div>
            <div className={styles.badgeRow}>
              <span className={styles.badge}>{state.outerCompleted ? "ho$ 已完成" : "ho$ 未完成"}</span>
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
              const values = state.innerValuesByInner[card.inner];

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
                    <span className={styles.badge}>{values.length > 0 ? `最新 ${values[values.length - 1]}` : "暂无最新值"}</span>
                  </div>
                  <div className={styles.tokenRow}>
                    {values.map((value) => (
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
              <span className={styles.outputTitle}>combined$ 输出</span>
              <span className={styles.outputMeta}>任一内部流更新，都会使用所有内部流的最新值</span>
            </div>

            {state.snapshots.length === 0 ? (
              <p className={styles.placeholder}>{"// 先等 ho$ 完成，再等每个内部流至少发出一个值"}</p>
            ) : (
              state.snapshots.map((snapshot, index) => (
                <div key={`${snapshot.values.join("-")}-${snapshot.at}-${index}`} className={styles.outputLine}>
                  <span className={styles.outputValue}>[{snapshot.values.join(", ")}]</span>
                  <span className={styles.outputTime}>{snapshot.at}</span>
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
            <strong>先等外层完成</strong>：combineAll 需要先确定参与 combineLatest 的内部 Observable 集合。
          </li>
          <li>
            <strong>先等齐首值</strong>：每个内部 Observable 都至少发出一个值之后，才会有第一条输出。
          </li>
          <li>
            <strong>输出最新组合</strong>：任一内部 Observable 更新，就和其他内部流的最新值重新组合。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="combineAll 与 combineLatestAll" code={WAIT_CODE} />
    </div>
  );
}
