"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { FindIndexDemoModel, type FindIndexMode } from "./find-index-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 6.2.2 find 和 findIndex：寻找第一个匹配值

const BOOK_CODE = `// 6.2.2 find 和 findIndex
import { find, findIndex, of } from "rxjs";

const source$ = of(3, 1, 4, 1, 5, 9);
const isEven = (x: number) => x % 2 === 0;

source$.pipe(find(isEven)).subscribe(console.log);
source$.pipe(findIndex(isEven)).subscribe(console.log);

// find 输出：4
// findIndex 输出：2`;

const MISSING_CODE = `// 没有匹配值时
import { find, findIndex, of } from "rxjs";

const source$ = of(3, 1, 5, 9);
const isEven = (x: number) => x % 2 === 0;

source$.pipe(find(isEven)).subscribe(console.log);      // undefined
source$.pipe(findIndex(isEven)).subscribe(console.log); // -1`;

export default function FindIndexPage() {
  const [demo] = useState(() => new FindIndexDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: FindIndexMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>6.2.2 find 和 findIndex：寻找第一个匹配值</h1>
        <p className={styles.subtitle}>
          find 和 findIndex 都寻找第一个满足 predicate 的值。find 输出值本身，findIndex 输出它在上游序列里的序号；找到后会立刻 complete。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("found")} disabled={state.running}>
                找到偶数
              </button>
              <button className={styles.primaryBtn} onClick={() => run("missing")} disabled={state.running}>
                找不到
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>predicate</span>
            <code>{"(x) => x % 2 === 0"}</code>
          </div>

          <div className={styles.sourcePanel}>
            <h3 className={styles.cardTitle}>source$</h3>
            <div className={styles.tokenRow}>
              {state.sourceValues.length === 0 ? (
                <span className={styles.empty}>等待 source$ 发值</span>
              ) : (
                state.sourceValues.map((item, index) => (
                  <span key={`${item.value}-${item.at}`} className={styles.token}>
                    <small>#{index}</small>
                    {item.value}
                    <small>{item.at}</small>
                  </span>
                ))
              )}
            </div>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>find(isEven)</h3>
              {state.result ? (
                <div className={styles.result}>
                  <strong>{state.result.found === undefined ? "undefined" : state.result.found}</strong>
                  <span>{state.result.at}</span>
                </div>
              ) : (
                <p className={styles.empty}>{"// 等待匹配值或 complete"}</p>
              )}
            </article>

            <article className={styles.card}>
              <h3 className={styles.cardTitle}>findIndex(isEven)</h3>
              {state.result ? (
                <div className={styles.result}>
                  <strong>{state.result.index}</strong>
                  <span>{state.result.at}</span>
                </div>
              ) : (
                <p className={styles.empty}>{"// 等待匹配序号或 complete"}</p>
              )}
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>找到就结束</strong>：第一个匹配值出现后，后续上游值不再需要。
          </li>
          <li>
            <strong>找不到等 complete</strong>：没有匹配值时，必须等上游结束才能确定。
          </li>
          <li>
            <strong>失败值不同</strong>：find 输出 undefined，findIndex 输出 -1。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="没有匹配值的结果" code={MISSING_CODE} />
    </div>
  );
}
