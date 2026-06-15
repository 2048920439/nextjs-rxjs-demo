"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { ZipAllDemoModel, type ZipAllInnerId } from "./zip-all-demo.model";

// sidebar-title: 5.2.2 zipAll：等待外层完成后拉链配对

const INNER_CARDS: { inner: ZipAllInnerId; title: string; note: string }[] = [
  {
    inner: "inner0",
    title: "inner0$",
    note: "ho$ 产生的第一个内部 Observable",
  },
  {
    inner: "inner1",
    title: "inner1$",
    note: "ho$ 产生的第二个内部 Observable",
  },
];

const BOOK_CODE = `// 5.2.2 zipAll：等待外层完成后拉链配对
import { interval, map, take, zipAll } from "rxjs";

const ho$ = interval(1000).pipe(
  take(2),
  map((x) =>
    interval(1500).pipe(
      map((y) => \`\${x}:\${y}\`),
      take(2),
    ),
  ),
);

const zipped$ = ho$.pipe(zipAll());

// 输出：
// ["0:0", "1:0"]
// ["0:1", "1:1"]`;

const WAIT_CODE = `// zipAll 必须先等 ho$ 完成
// 因为只有外层完成后，它才知道到底要把几个内部 Observable 拉链配对
//
// 如果 ho$ 不 complete，zipAll 就无法开始配对输出`;

export default function ZipAllPage() {
  const [demo] = useState(() => new ZipAllDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.2.2 zipAll：等待外层完成后拉链配对</h1>
        <p className={styles.subtitle}>
          zipAll 会把 ho$ 产生的所有内部 Observable 当作 zip 的输入。它必须先等 ho$ complete，确定输入数量之后，才开始订阅内部流并按位置配对。
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
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.pairs.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.outerBox}>
            <div>
              <h3 className={styles.cardTitle}>ho$</h3>
              <p className={styles.cardMeta}>先产生内部 Observable；complete 后 zipAll 才开始订阅它们</p>
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
                    <span className={styles.badge}>内部值 {values.length}</span>
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
              <span className={styles.outputTitle}>zipped$ 输出</span>
              <span className={styles.outputMeta}>第 0 个配第 0 个，第 1 个配第 1 个</span>
            </div>

            {state.pairs.length === 0 ? (
              <p className={styles.placeholder}>{"// 先等 ho$ 完成，再输出配对数组"}</p>
            ) : (
              state.pairs.map((pair, index) => (
                <div key={`${pair.values.join("-")}-${pair.at}-${index}`} className={styles.outputLine}>
                  <span className={styles.outputValue}>[{pair.values.join(", ")}]</span>
                  <span className={styles.outputTime}>{pair.at}</span>
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
            <strong>先等外层完成</strong>：zipAll 需要知道一共有几个内部 Observable 参与配对。
          </li>
          <li>
            <strong>按位置组合</strong>：每个内部流各取一个值，组成一组数组输出。
          </li>
          <li>
            <strong>外层不结束就不输出</strong>：如果 ho$ 永不 complete，zipAll 没法确定输入集合，也就不会开始拉链配对。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="为什么要等 ho$ complete" code={WAIT_CODE} />
    </div>
  );
}
