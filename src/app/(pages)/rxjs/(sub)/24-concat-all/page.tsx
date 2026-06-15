"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { ConcatAllDemoModel, type ConcatAllInnerId } from "./concat-all-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 5.2.2 concatAll：顺序摊平高阶 Observable

const INNER_CARDS: { inner: ConcatAllInnerId; title: string; note: string }[] = [
  {
    inner: "inner0",
    title: "inner0$",
    note: "ho$ 第一次产生，concatAll 会立刻订阅它",
  },
  {
    inner: "inner1",
    title: "inner1$",
    note: "ho$ 第二次产生，但必须等 inner0$ complete 后才会被订阅",
  },
];

const BOOK_CODE = `// 5.2.2 concatAll：顺序摊平高阶 Observable
import { concatAll, interval, map, take } from "rxjs";

const ho$ = interval(1000).pipe(
  take(2),
  map((x) =>
    interval(1500).pipe(
      map((y) => \`\${x}:\${y}\`),
      take(2),
    ),
  ),
);

const concated$ = ho$.pipe(concatAll());`;

const COMPARE_CODE = `// concatAll 没有额外输入参数
// 它只处理上游 ho$ 产生出来的内部 Observable
//
// 订阅策略：
// 1. 订阅第一个内部 Observable
// 2. 等它 complete
// 3. 再订阅下一个内部 Observable
// 4. 所有内部 Observable 都完成后，输出流 complete`;

export default function ConcatAllPage() {
  const [demo] = useState(() => new ConcatAllDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.2.2 concatAll：顺序摊平高阶 Observable</h1>
        <p className={styles.subtitle}>
          concatAll 面向的是高阶 Observable：上游吐出的每个值都是一个内部 Observable。它会像 concat
          一样顺序订阅这些内部流，前一个没有完成，下一个就只会排队等待。
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
              const isSubscribed = state.subscribedInners.includes(card.inner);
              const isCompleted = state.completedInners.includes(card.inner);
              const isActive = state.activeInner === card.inner;

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
                    <span className={styles.badge}>{isSubscribed ? "已订阅" : "未订阅"}</span>
                    <span className={styles.badge}>{isCompleted ? "已完成" : "等待完成"}</span>
                  </div>
                  <div className={styles.tokenRow}>
                    {state.outputs
                      .filter((item) => item.inner === card.inner)
                      .map((item) => (
                        <span key={`${item.value}-${item.at}`} className={styles.token}>
                          {item.value}
                        </span>
                      ))}
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>concated$ 输出</span>
              <span className={styles.outputMeta}>第二个内部流会在第一个内部流完成后才开始输出</span>
            </div>

            {state.outputs.length === 0 ? (
              <p className={styles.placeholder}>{"// 运行后这里会显示 concatAll 的 next 顺序"}</p>
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
            <strong>输入是高阶 Observable</strong>：ho$ 发出的不是普通值，而是一个个内部 Observable。
          </li>
          <li>
            <strong>顺序订阅内部流</strong>：concatAll 只在当前内部 Observable 完成后，才会订阅下一个内部 Observable。
          </li>
          <li>
            <strong>积压的是 Observable</strong>：如果上游持续产生内部流，而前一个内部流迟迟不结束，排队等待的是内部 Observable 本身。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="订阅策略" code={COMPARE_CODE} />
    </div>
  );
}
