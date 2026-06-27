"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { ReduceDemoModel } from "./reduce-demo.model";

// sidebar-title: 6.1.3 reduce：规约统计

const BOOK_CODE = `// 6.1.3 reduce：规约统计
import { range, reduce } from "rxjs";

const source$ = range(1, 100);
const reduced$ = source$.pipe(
  reduce((acc, current) => acc + current, 0),
);

reduced$.subscribe(console.log);

// 输出：5050`;

const AVERAGE_CODE = `// reduce 可以保存更复杂的累计结构
import { map, reduce } from "rxjs";

const average$ = source$.pipe(
  reduce(
    (acc, current) => ({
      sum: acc.sum + current,
      count: acc.count + 1,
    }),
    { sum: 0, count: 0 },
  ),
  map((acc) => acc.sum / acc.count),
);`;

export default function ReducePage() {
  const [demo] = useState(() => new ReduceDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>6.1.3 reduce：规约统计</h1>
        <p className={styles.subtitle}>
          reduce 接收规约函数和可选 seed，把上游的多个值逐个折叠到同一个累计值里。和 count、max、min 一样，它也只在上游 complete 后输出最终结果。
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
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.steps.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.formula}>
            <span>reduce((acc, current) =&gt; acc + current, 0)</span>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>规约过程</h3>
                <span className={styles.cardMeta}>source$ 依次发出 1、2、3、4、5、6</span>
              </div>
              <div className={styles.stepList}>
                {state.steps.length === 0 ? (
                  <p className={styles.placeholder}>{"// 等待 source$ 发值"}</p>
                ) : (
                  state.steps.map((step) => (
                    <div key={`${step.current}-${step.at}`} className={styles.step}>
                      <span className={styles.stepValue}>current {step.current}</span>
                      <span className={styles.stepArrow}>→</span>
                      <span className={styles.stepAccumulation}>acc {step.accumulation}</span>
                      <span className={styles.stepTime}>{step.at}</span>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>reduced$ 输出</h3>
                <span className={styles.cardMeta}>上游 complete 后才发出最终累计值</span>
              </div>
              {state.result ? (
                <div className={styles.result}>
                  <span className={styles.resultValue}>{state.result.value}</span>
                  <span className={styles.resultMeta}>输出于 {state.result.at}</span>
                </div>
              ) : (
                <p className={styles.placeholder}>{"// 还没有 complete，不输出中间值"}</p>
              )}
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>acc 是累计值</strong>：每次规约函数返回的新值，会成为下一次的 acc。
          </li>
          <li>
            <strong>seed 是初始值</strong>：示例里 seed 为 0，所以第一次是 0 + 1。
          </li>
          <li>
            <strong>输出最终结果</strong>：reduce 不输出每一步中间值，只在 complete 后给出最终累计值。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="用 reduce 计算平均数" code={AVERAGE_CODE} />
    </div>
  );
}
