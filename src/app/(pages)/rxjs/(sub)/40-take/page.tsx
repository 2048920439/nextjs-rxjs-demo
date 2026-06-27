"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { TakeDemoModel } from "./take-demo.model";

// sidebar-title: 7.1.4 take：只取前 N 个值

const BOOK_CODE = `// 7.1.4 take
import { interval, take } from "rxjs";

const source$ = interval(1000);
const result$ = source$.pipe(take(3));

result$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// 输出：0, 1, 2, complete`;

const COMBO_CODE = `// filter + take：取满足条件的前 N 个值
import { filter, interval, take } from "rxjs";

const source$ = interval(1000);
const even$ = source$.pipe(
  filter((value) => value % 2 === 0),
  take(2),
);

// 输出：0, 2, complete`;

export default function TakePage() {
  const [demo] = useState(() => new TakeDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.4 take：只取前 N 个值</h1>
        <p className={styles.subtitle}>take(count) 从上游拿前 count 个值。每拿到一个就立即转发给下游；拿够后会主动 complete，并退订可能还会继续发值的上游。</p>
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
            <span>operator</span>
            <code>take(3)</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>interval 持续发值，但 take 拿够 3 个后会退订</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
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
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>下游立即收到前三个值</p>
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
            <strong>立即转发</strong>：还没拿够前，上游 next 会直接进入下游。
          </li>
          <li>
            <strong>拿够就结束</strong>：达到 count 后，take 主动 complete。
          </li>
          <li>
            <strong>适合限制无限流</strong>：可以把 interval 这类无限流截成有限流。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="filter + take 组合" code={COMBO_CODE} />
    </div>
  );
}
