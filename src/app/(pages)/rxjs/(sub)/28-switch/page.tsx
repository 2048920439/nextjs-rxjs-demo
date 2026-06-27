"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { SwitchDemoModel, type SwitchInnerId } from "./switch-demo.model";

// sidebar-title: 5.2.3 switch：切换到最新内部 Observable

const INNER_CARDS: { inner: SwitchInnerId; title: string; note: string }[] = [
  {
    inner: "inner0",
    title: "inner0$",
    note: "先输出 0:0，随后被 inner1$ 取代",
  },
  {
    inner: "inner1",
    title: "inner1$",
    note: "先输出 1:0，随后被 inner2$ 取代",
  },
  {
    inner: "inner2",
    title: "inner2$",
    note: "最后一个内部流，会完整输出 2:0、2:1",
  },
];

const BOOK_CODE = `// 5.2.3 switch：切换输入 Observable
import { interval, map, switchAll, take } from "rxjs";

const ho$ = interval(1000).pipe(
  take(3),
  map((x) =>
    interval(700).pipe(
      map((y) => \`\${x}:\${y}\`),
      take(2),
    ),
  ),
);

const result$ = ho$.pipe(switchAll());

// 输出：0:0, 1:0, 2:0, 2:1`;

const RULE_CODE = `// switchAll 会始终订阅最新的内部 Observable
// 新内部流出现时，旧内部流会被退订
// 完成条件：ho$ 已完成，并且当前最新内部流也已完成`;

export default function SwitchPage() {
  const [demo] = useState(() => new SwitchDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.2.3 switch：切换到最新内部 Observable</h1>
        <p className={styles.subtitle}>
          switch 处理高阶 Observable 时，总是切换到最新产生的内部 Observable。新的内部流出现后，旧内部流会被退订，后续值不会再进入下游。
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
              const isCancelled = state.cancelledInners.includes(card.inner);
              const isCompleted = state.completedInners.includes(card.inner);
              const values = state.outputsByInner[card.inner];

              return (
                <article
                  key={card.inner}
                  className={clsx(styles.card, styles[`${card.inner}Card`], {
                    [styles.activeCard]: isActive,
                    [styles.cancelledCard]: isCancelled,
                  })}
                >
                  <div className={styles.cardTop}>
                    <h3 className={styles.cardTitle}>{card.title}</h3>
                    <span className={styles.cardMeta}>{card.note}</span>
                  </div>
                  <div className={styles.badgeRow}>
                    <span className={styles.badge}>{isActive ? "当前最新" : isCancelled ? "已退订" : isCompleted ? "已完成" : "等待中"}</span>
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
              <span className={styles.outputMeta}>只转发当前最新内部 Observable 的值</span>
            </div>

            {state.outputs.length === 0 ? (
              <p className={styles.placeholder}>{"// 运行后这里会看到 0:0, 1:0, 2:0, 2:1"}</p>
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
            <strong>最新优先</strong>：新的内部 Observable 出现时，switch 会立即切换过去。
          </li>
          <li>
            <strong>旧流退订</strong>：被替换的内部 Observable 后续值不会进入下游。
          </li>
          <li>
            <strong>不是 race</strong>：race 锁定第一个发值的来源；switch 会随着新的内部流出现而不断换来源。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="切换规则" code={RULE_CODE} />
    </div>
  );
}
