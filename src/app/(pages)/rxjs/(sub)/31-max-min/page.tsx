"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { MaxMinDemoModel } from "./max-min-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 6.1.2 max 和 min：最大最小值

const BOOK_CODE = `// 6.1.2 max 和 min：最大最小值
import { min, of } from "rxjs";

const initialRelease$ = of(
  { name: "RxJS", year: 2011 },
  { name: "React", year: 2013 },
  { name: "Redux", year: 2015 },
);

const earliest$ = initialRelease$.pipe(
  min((a, b) => a.year - b.year),
);

earliest$.subscribe(console.log);

// 输出：{ name: "RxJS", year: 2011 }`;

const COMPARER_CODE = `// 比较函数约定
// 返回 0：两个值相同
// 返回正数：a 大于 b
// 返回负数：a 小于 b
const compareByYear = (a, b) => a.year - b.year;

source$.pipe(min(compareByYear)); // year 最小的对象
source$.pipe(max(compareByYear)); // year 最大的对象`;

export default function MaxMinPage() {
  const [demo] = useState(() => new MaxMinDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>6.1.2 max 和 min：最大最小值</h1>
        <p className={styles.subtitle}>max 和 min 会在上游完整结束后，从所有值里挑出最大或最小的那一个。处理对象时，需要提供比较函数来说明“大小”如何判断。</p>
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

          <div className={styles.sourcePanel}>
            <div>
              <h3 className={styles.cardTitle}>initialRelease$</h3>
              <p className={styles.cardMeta}>依次发出 3 个对象，比较函数使用 year 字段</p>
            </div>
            <div className={styles.tokenRow}>
              {state.sourceValues.length === 0 ? (
                <span className={styles.empty}>等待对象发出</span>
              ) : (
                state.sourceValues.map((item) => (
                  <span key={`${item.name}-${item.at}`} className={styles.token}>
                    <strong>{item.name}</strong>
                    <small>{item.year}</small>
                    <small>{item.at}</small>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className={styles.grid}>
            <article className={clsx(styles.card, styles.minCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>min(compareByYear)</h3>
                <span className={styles.cardMeta}>year 最小：最早发布</span>
              </div>
              {state.result ? (
                <div className={styles.result}>
                  <span className={styles.resultName}>{state.result.earliest.name}</span>
                  <span className={styles.resultYear}>{state.result.earliest.year}</span>
                </div>
              ) : (
                <p className={styles.placeholder}>{"// 等待 source$ complete"}</p>
              )}
            </article>

            <article className={clsx(styles.card, styles.maxCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>max(compareByYear)</h3>
                <span className={styles.cardMeta}>year 最大：最晚发布</span>
              </div>
              {state.result ? (
                <div className={styles.result}>
                  <span className={styles.resultName}>{state.result.latest.name}</span>
                  <span className={styles.resultYear}>{state.result.latest.year}</span>
                </div>
              ) : (
                <p className={styles.placeholder}>{"// 等待 source$ complete"}</p>
              )}
            </article>
          </div>

          <div className={styles.output}>
            <span className={styles.outputTitle}>比较函数</span>
            <code>{"(a, b) => a.year - b.year"}</code>
            <span className={styles.outputMeta}>{state.result ? `两个结果都在 ${state.result.at} 产生` : "max/min 只有完整遍历后才输出"}</span>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>默认适合数值</strong>：数字流可以直接比较大小。
          </li>
          <li>
            <strong>对象需要 comparer</strong>：比较函数决定 max/min 眼里的“大”和“小”。
          </li>
          <li>
            <strong>仍然等 complete</strong>：只要上游还可能继续发值，最大值或最小值就还不能确定。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="比较函数规则" code={COMPARER_CODE} />
    </div>
  );
}
