"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { ElementAtDemoModel, type ElementAtMode } from "./element-at-demo.model";

// sidebar-title: 7.3.2 elementAt：按下标取一个值

const BOOK_CODE = `// 7.3.2 elementAt
import { elementAt, of } from "rxjs";

const source$ = of(3, 1, 2);
const result$ = source$.pipe(elementAt(3, null));

result$.subscribe(console.log);

// source$ 没有下标 3 的第 4 个值，输出默认值 null`;

const ERROR_CODE = `// 如果没有默认值，下标不存在会 error
of(3, 1, 2).pipe(
  elementAt(3),
).subscribe({
  error: console.error,
});`;

export default function ElementAtPage() {
  const [demo] = useState(() => new ElementAtDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: ElementAtMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.3.2 elementAt：按下标取一个值</h1>
        <p className={styles.subtitle}>
          elementAt(index, defaultValue) 把上游看成按顺序排列的数组，只输出指定下标的那个值；如果找不到，可以用第二个参数给默认值。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("hit")} disabled={state.running}>
                命中下标
              </button>
              <button className={styles.primaryBtn} onClick={() => run("default")} disabled={state.running}>
                默认值
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{state.mode === "hit" ? "source$.pipe(elementAt(1))" : "source$.pipe(elementAt(3, null))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>发出 3、1、2；下标从 0 开始</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item, index) => (
                    <span key={`${item.value}-${item.at}-${index}`} className={clsx(styles.token, item.selected ? styles.passToken : styles.dropToken)}>
                      {item.value}
                      <small>{`index ${index}`}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>只输出一个目标值或默认值</p>
              {state.output ? (
                <div className={styles.outputLine}>
                  <strong>{String(state.output.value)}</strong>
                  <span>{`${state.output.source} · ${state.output.at}`}</span>
                </div>
              ) : (
                <p className={styles.empty}>{"// 等待目标下标或 complete"}</p>
              )}
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>下标从 0 开始</strong>：elementAt(1) 取第二个 next。
          </li>
          <li>
            <strong>可给默认值</strong>：找不到目标下标时，用 defaultValue 输出。
          </li>
          <li>
            <strong>无默认会报错</strong>：上游 complete 还没等到目标下标时会 error。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="没有默认值时的错误路径" code={ERROR_CODE} />
    </div>
  );
}
