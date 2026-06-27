"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { IsEmptyDemoModel, type IsEmptyMode } from "./is-empty-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 6.2.3 isEmpty：判断空 Observable

const BOOK_CODE = `// 6.2.3 isEmpty：判断空 Observable
import { EMPTY, isEmpty } from "rxjs";

const source$ = EMPTY;
const isEmpty$ = source$.pipe(isEmpty());

isEmpty$.subscribe(console.log);

// 输出：true`;

const NOT_EMPTY_CODE = `// 只要上游发出第一个 next，就能确定它不是空的
import { interval, isEmpty } from "rxjs";

const source$ = interval(1000);
const isEmpty$ = source$.pipe(isEmpty());

isEmpty$.subscribe(console.log);

// source$ 第一次发值时输出：false`;

export default function IsEmptyPage() {
  const [demo] = useState(() => new IsEmptyDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: IsEmptyMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>6.2.3 isEmpty：判断空 Observable</h1>
        <p className={styles.subtitle}>
          isEmpty 判断上游是否“没有发出任何 next 就 complete”。如果上游先 complete，结果是 true；如果上游先发出第一个 next，结果立刻是 false。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("empty")} disabled={state.running}>
                空流
              </button>
              <button className={styles.primaryBtn} onClick={() => run("not-empty")} disabled={state.running}>
                非空流
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>
                {state.mode === "empty" ? "EMPTY 延迟 complete，不发 next" : "先发 first，再发 second；但 isEmpty 看到 first 就结束"}
              </p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>暂无 next</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={styles.token}>
                      {item.value}
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>source$.pipe(isEmpty())</h3>
              <p className={styles.cardMeta}>输出一个布尔值，然后 complete</p>
              {state.result ? (
                <div className={styles.result}>
                  <strong>{String(state.result.value)}</strong>
                  <span>{state.result.at}</span>
                </div>
              ) : (
                <p className={styles.empty}>{"// 等待 first next 或 complete"}</p>
              )}
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>true 等 complete</strong>：没有任何 next，直到 complete 才能证明为空。
          </li>
          <li>
            <strong>false 可提前</strong>：第一个 next 足以证明不空。
          </li>
          <li>
            <strong>never 没结果</strong>：既不 next 也不 complete 的上游会让 isEmpty 一直等待。
          </li>
        </ul>
      </aside>

      <CodeBlock title="空流结果" code={BOOK_CODE} />
      <CodeBlock title="非空流结果" code={NOT_EMPTY_CODE} />
    </div>
  );
}
