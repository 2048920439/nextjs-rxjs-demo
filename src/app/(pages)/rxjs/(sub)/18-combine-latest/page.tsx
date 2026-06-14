"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { CombineLatestDemoModel } from "./combine-latest-demo.model";
import styles from "./page.module.scss";

const BOOK_CODE = `// 5.1.4 combineLatest：合并最后一个数据
import { combineLatest, timer } from "rxjs";
import { map } from "rxjs/operators";

const source1$ = timer(500, 1000).pipe(map((x) => x + "A"));
const source2$ = timer(1000, 1000).pipe(map((x) => x + "B"));

const result$ = combineLatest([source1$, source2$]);

result$.subscribe(console.log);
// 任一源更新，都会拿所有源的最新值重新组合一次`;

const BOOK_CODE_PROJECT = `// combineLatest 也可以直接做输出映射
const result$ = combineLatest([source1$, source2$]).pipe(
  map(([a, b]) => \`\${a} and \${b}\`),
);`;

export default function CombineLatestPage() {
  const [demo] = useState(() => new CombineLatestDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);
  const latestSnapshot = state.snapshots[state.snapshots.length - 1];

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.4 combineLatest：合并最后一个数据</h1>
        <p className={styles.subtitle}>combineLatest 不是按位置配对，而是“只要有一个源更新，就把所有源的最新值重新组合起来”。</p>
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

          <div className={styles.grid}>
            <article className={clsx(styles.card, styles.tempCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>temperature$</h3>
                <span className={styles.cardMeta}>每 700ms 更新一次，模拟温度变化</span>
              </div>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>已发射 {state.temperatureValues.length}</span>
                <span className={styles.badge}>
                  {state.temperatureValues.length > 0 ? `最新 ${state.temperatureValues[state.temperatureValues.length - 1]}C` : "等待中"}
                </span>
              </div>
              <div className={styles.tokenRow}>
                {state.temperatureValues.length === 0 ? (
                  <span className={styles.empty}>暂无</span>
                ) : (
                  state.temperatureValues.map((value, index) => (
                    <span key={`${value}-${index}`} className={styles.token}>
                      {value}C
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={clsx(styles.card, styles.windCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>wind$</h3>
                <span className={styles.cardMeta}>每 1500ms 更新一次，模拟风向变化</span>
              </div>
              <div className={styles.badgeRow}>
                <span className={styles.badge}>已发射 {state.windValues.length}</span>
                <span className={styles.badge}>{state.windValues.length > 0 ? `最新 ${state.windValues[state.windValues.length - 1]}` : "等待中"}</span>
              </div>
              <div className={styles.tokenRow}>
                {state.windValues.length === 0 ? (
                  <span className={styles.empty}>暂无</span>
                ) : (
                  state.windValues.map((value, index) => (
                    <span key={`${value}-${index}`} className={styles.token}>
                      {value}
                    </span>
                  ))
                )}
              </div>
            </article>
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>combineLatest 输出</span>
              <span className={styles.outputMeta}>任一源更新都会使用双方的最新值重新组合</span>
            </div>

            {state.snapshots.length === 0 ? (
              <p className={styles.placeholder}>{"// 先等两边都至少发出一次，才会开始组合输出"}</p>
            ) : (
              state.snapshots.map((snapshot, index) => (
                <div key={`${snapshot.temperature}-${snapshot.wind}-${index}`} className={styles.outputLine}>
                  <span className={styles.outputPair}>
                    {snapshot.temperature}C / {snapshot.wind}
                  </span>
                </div>
              ))
            )}

            {latestSnapshot && (
              <div className={styles.latestBox}>
                当前最新快照：{latestSnapshot.temperature}C + {latestSnapshot.wind}
              </div>
            )}
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>最新快照</strong>：任一输入流发射新值，输出都会用它和其他流的最新值一起更新。
          </li>
          <li>
            <strong>先等齐再发</strong>：只要还有一个输入流没发过值，combineLatest 就不会输出。
          </li>
          <li>
            <strong>适合联动 UI</strong>：表单摘要、天气面板、筛选条件组合都很典型。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
      <CodeBlock title="使用 project/map 定制输出" code={BOOK_CODE_PROJECT} />
    </div>
  );
}
