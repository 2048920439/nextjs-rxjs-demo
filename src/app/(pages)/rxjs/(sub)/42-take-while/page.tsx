"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { TakeWhileDemoModel } from "./take-while-demo.model";

// sidebar-title: 7.1.4 takeWhile：条件为真时持续取值

const BOOK_CODE = `// 7.1.4 takeWhile
import { range, takeWhile } from "rxjs";

const source$ = range(1, 100);
const result$ = source$.pipe(
  takeWhile((value) => value < 4),
);

result$.subscribe(console.log);

// 输出：1, 2, 3`;

const IMPLEMENT_TAKE_CODE = `// takeWhile 的 predicate 有 index 参数，可以模拟 take
source$.pipe(
  takeWhile((_value, index) => index < 3),
);

// 等价于 source$.pipe(take(3))`;

export default function TakeWhilePage() {
  const [demo] = useState(() => new TakeWhileDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.4 takeWhile：条件为真时持续取值</h1>
        <p className={styles.subtitle}>
          takeWhile(predicate) 会持续转发满足条件的上游值；一旦 predicate 第一次返回 false，它就立即 complete，后面的上游值不会再进入下游。
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

          <div className={styles.rule}>
            <span>predicate</span>
            <code>{"(value) => value < 4"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>发出 1、2、3、4...；4 第一次让 predicate 返回 false</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={clsx(styles.token, item.passed ? styles.passToken : styles.stopToken)}>
                      {item.value}
                      <small>{item.passed ? "pass" : "stop"}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>只收到 1、2、3</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待输出"}</span>
                ) : (
                  state.outputs.map((item) => (
                    <div key={`${item.value}-${item.at}`} className={styles.outputLine}>
                      <strong>{item.value}</strong>
                      <span>{item.at}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>连续取值</strong>：条件为 true 的值会立即转发。
          </li>
          <li>
            <strong>第一次 false 就结束</strong>：后面即使有值满足条件，也不会再看。
          </li>
          <li>
            <strong>predicate 有 index</strong>：可用 index 实现类似 take(count) 的逻辑。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="用 takeWhile 模拟 take" code={IMPLEMENT_TAKE_CODE} />
    </div>
  );
}
