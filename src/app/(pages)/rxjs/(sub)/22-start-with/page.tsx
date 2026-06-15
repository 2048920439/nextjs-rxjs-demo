"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { StartWithDemoModel } from "./start-with-demo.model";

// sidebar-title: 5.1.8 startWith

const BOOK_CODE = `// 5.1.8 startWith
import { timer } from "rxjs";
import { startWith } from "rxjs/operators";

const original$ = timer(0, 1000);
const result$ = original$.pipe(startWith("start"));

result$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// 输出顺序：start, 0, 1, ...`;

const CONCAT_CODE = `// startWith 可以理解为在上游前面 concat 一个同步值
import { concat, of, timer } from "rxjs";

const original$ = timer(1000, 1000);
const result$ = concat(of("start"), original$);`;

export default function StartWithPage() {
  const [demo] = useState(() => new StartWithDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.8 startWith</h1>
        <p className={styles.subtitle}>startWith 会在订阅时先同步吐出指定值，再继续订阅上游 Observable；它适合给数据流补一个初始状态。</p>
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

          <div className={styles.grid}>
            <article className={clsx(styles.card, styles.sourceCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>original$</h3>
                <span className={styles.cardMeta}>订阅后 1000ms 开始，每 1000ms 发出一个数字</span>
              </div>
              <div className={styles.tokenRow}>
                {state.originalValues.length === 0 ? (
                  <span className={styles.empty}>暂无上游数据</span>
                ) : (
                  state.originalValues.map((item) => (
                    <span key={`original-${item.value}-${item.at}`} className={styles.token}>
                      {item.value}
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={clsx(styles.card, styles.resultCard)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>result$ = original$.pipe(startWith(&quot;start&quot;))</h3>
                <span className={styles.cardMeta}>先输出 start，再继续转发 original$</span>
              </div>
              <div className={styles.output}>
                {state.outputs.length === 0 ? (
                  <p className={styles.placeholder}>{"// 运行后 start 会立刻出现"}</p>
                ) : (
                  state.outputs.map((item, index) => (
                    <div key={`${item.value}-${item.at}-${index}`} className={styles.outputLine}>
                      <span className={clsx(styles.sourceTag, item.source === "startWith" && styles.startTag)}>{item.source}</span>
                      <span className={styles.outputValue}>{item.value}</span>
                      <span className={styles.outputTime}>{item.at}</span>
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
            <strong>订阅时先发</strong>：startWith 的参数会在上游数据之前同步输出。
          </li>
          <li>
            <strong>不改变上游</strong>：上游 Observable 的发值节奏和完成时机保持原样。
          </li>
          <li>
            <strong>适合初始状态</strong>：UI 默认值、加载前占位状态、表单初始快照都很典型。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="用 concat 理解 startWith" code={CONCAT_CODE} />
    </div>
  );
}
