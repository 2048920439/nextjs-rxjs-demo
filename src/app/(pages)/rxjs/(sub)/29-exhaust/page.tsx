"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { ExhaustDemoModel, type ExhaustInnerId } from "./exhaust-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 5.2.3 exhaust：耗尽当前内部 Observable

const INNER_CARDS: { inner: ExhaustInnerId; title: string; note: string }[] = [
  {
    inner: "inner0",
    title: "inner0$",
    note: "先被订阅，完整输出 0:0、0:1",
  },
  {
    inner: "inner1",
    title: "inner1$",
    note: "出现时 inner0$ 还没完成，因此被忽略",
  },
  {
    inner: "inner2",
    title: "inner2$",
    note: "出现时已经空闲，因此会被订阅并完整输出",
  },
];

const BOOK_CODE = `// 5.2.3 exhaust：耗尽当前内部 Observable
import { exhaustAll, interval, map, take } from "rxjs";

const ho$ = interval(1000).pipe(
  take(3),
  map((x) =>
    interval(700).pipe(
      map((y) => \`\${x}:\${y}\`),
      take(2),
    ),
  ),
);

const result$ = ho$.pipe(exhaustAll());

// 输出：0:0, 0:1, 2:0, 2:1`;

const RULE_CODE = `// exhaustAll 会先耗尽当前内部 Observable
// 当前内部流未完成时，新出现的内部流会被忽略
// 完成条件：ho$ 已完成，并且当前内部流也已完成`;

export default function ExhaustPage() {
  const [demo] = useState(() => new ExhaustDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.2.3 exhaust：耗尽当前内部 Observable</h1>
        <p className={styles.subtitle}>
          exhaust 处理高阶 Observable 时，会坚持当前已经订阅的内部流。只要当前内部流还没完成，新出现的内部 Observable 就会被忽略。
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
              <p className={styles.cardMeta}>每 1000ms 产生一个内部 Observable，一共产生 3 个</p>
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
              const isActive = state.activeInner === card.inner;
              const isIgnored = state.ignoredInners.includes(card.inner);
              const isCompleted = state.completedInners.includes(card.inner);
              const values = state.outputsByInner[card.inner];

              return (
                <article
                  key={card.inner}
                  className={clsx(styles.card, styles[`${card.inner}Card`], {
                    [styles.activeCard]: isActive,
                    [styles.ignoredCard]: isIgnored,
                  })}
                >
                  <div className={styles.cardTop}>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    <span className={styles.cardMeta}>{card.note}</span>
                  </div>
                  <div className={styles.badgeRow}>
                    <span className={styles.badge}>{isActive ? "活跃中" : isIgnored ? "已忽略" : isCompleted ? "已完成" : "等待中"}</span>
                    <span className={styles.badge}>输出 {values.length}</span>
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
              <span className={styles.outputTitle}>result$ 输出</span>
              <span className={styles.outputMeta}>只转发未被忽略的内部 Observable</span>
            </div>

            {state.outputs.length === 0 ? (
              <p className={styles.placeholder}>{"// 运行后这里会看到 0:0, 0:1, 2:0, 2:1"}</p>
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
            <strong>当前优先</strong>：只要当前内部 Observable 没完成，exhaust 就继续跟随它。
          </li>
          <li>
            <strong>新流会被忽略</strong>：重叠期间出现的新内部 Observable 不会被订阅。
          </li>
          <li>
            <strong>和 switch 相反</strong>：switch 选择新的，exhaust 坚持旧的。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="耗尽规则" code={RULE_CODE} />
    </div>
  );
}
