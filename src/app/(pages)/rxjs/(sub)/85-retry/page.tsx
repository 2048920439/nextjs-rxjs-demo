"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { RetryDemoModel } from "./retry-demo.model";

// sidebar-title: 9.3.2 retry：立即重新订阅上游

const BOOK_CODE = `// 9.3.2 retry
import { catchError, map, of, range, retry } from "rxjs";

const source$ = range(1, 5);
const error$ = source$.pipe(map(throwOnUnluckyNumber));

const result$ = error$.pipe(
  retry(2),
  catchError(() => of(8)),
);

result$.subscribe(console.log);
// 1, 2, 3, 1, 2, 3, 1, 2, 3, 8`;

const NOTE_CODE = `// retry(2) 表示出错后额外重试 2 次
// 第一次订阅失败 + 两次重试失败后，错误继续交给 catchError 恢复。`;

export default function RetryPage() {
  const [demo] = useState(() => new RetryDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>9.3.2 retry：立即重新订阅上游</h1>
        <p className={styles.subtitle}>
          retry 在收到 error 后会重新订阅上游 Observable。它适合临时失败可能恢复的场景；如果重试次数耗尽，错误仍然会继续向下游传递，通常再交给 catchError
          做兜底恢复。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={run} disabled={state.running}>
                运行
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{"source$.pipe(map(throwOnUnluckyNumber), retry(2), catchError(() => of(8)))"}</code>
          </div>

          <div className={styles.notifier}>
            <span>retry(2)</span>
            <strong>
              {state.errors.length === 0 ? "等待上游 error" : state.errors.map((item) => `try ${item.attempt}: ${item.action} @ ${item.at}`).join(" / ")}
            </strong>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>每次订阅都会重新从 1 开始；4 触发错误后 retry 立即重来</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span
                      key={`${item.attempt}-${item.value}-${item.at}`}
                      className={clsx(styles.token, item.value === 4 ? styles.pendingToken : styles.passToken)}
                    >
                      {item.value}
                      <small>{`try ${item.attempt}`}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>两次重试都失败后，catchError 输出 8 作为恢复值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 retry 输出"}</span>
                ) : (
                  state.outputs.map((item) => (
                    <div key={`${item.label}-${item.value}-${item.at}`} className={styles.outputLine}>
                      <strong>{item.kind === "recovery" ? `fallback ${item.value}` : `next ${item.value}`}</strong>
                      <span>{`${item.label} / ${item.at}`}</span>
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
            <strong>重新订阅</strong>：retry 不是继续原来的流，而是让上游 Observable 从头再走一遍。
          </li>
          <li>
            <strong>有限次数</strong>：retry(2) 表示错误后额外重试两次，避免无限循环。
          </li>
          <li>
            <strong>配合恢复</strong>：重试仍失败时，catchError 再提供默认值。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="retry 次数说明" code={NOTE_CODE} />
    </div>
  );
}
