"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { CatchErrorDemoModel, type CatchErrorMode } from "./catch-error-demo.model";

// sidebar-title: 9.3.1 catchError：捕获并恢复错误

const BOOK_CODE = `// 9.3.1 catch 在 RxJS 7 中对应 catchError
import { catchError, map, of, range } from "rxjs";

const throwOnUnluckyNumber = (value) => {
  if (value === 4) {
    throw new Error("unlucky number 4");
  }
  return value;
};

const source$ = range(1, 5);
const result$ = source$.pipe(
  map(throwOnUnluckyNumber),
  catchError(() => of(8)),
);

result$.subscribe(console.log);
// 1, 2, 3, 8`;

const CAUGHT_CODE = `// selector 的第二个参数 caught$ 可以重新订阅上游
const result$ = source$.pipe(
  map(throwOnUnluckyNumber),
  catchError((err, caught$) => caught$),
  take(10),
);

// 1, 2, 3, 1, 2, 3, 1, 2, 3, 1`;

export default function CatchErrorPage() {
  const [demo] = useState(() => new CatchErrorDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: CatchErrorMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>9.3.1 catchError：捕获并恢复错误</h1>
        <p className={styles.subtitle}>
          书中的 catch 在 RxJS 7 中写作 catchError。它捕获上游 error，并用 selector 返回的新 Observable 接管下游，让错误变成可控的恢复值或重试流程。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("single")} disabled={state.running}>
                恢复 8
              </button>
              <button className={styles.primaryBtn} onClick={() => run("repeat")} disabled={state.running}>
                恢复 8x8
              </button>
              <button className={styles.primaryBtn} onClick={() => run("caught")} disabled={state.running}>
                返回 caught$
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{"source$.pipe(map(throwOnUnluckyNumber), catchError(() => of(8)))"}</code>
          </div>

          <div className={styles.notifier}>
            <span>catchError</span>
            <strong>
              {state.errors.length === 0 ? "等待捕获 error" : state.errors.map((item) => `try ${item.attempt}: ${item.action} @ ${item.at}`).join(" / ")}
            </strong>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>1、2、3 可以通过；4 会在 map 中抛出错误，5 因为流已中断不会继续</p>
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
              <p className={styles.cardMeta}>错误不会直接进入 Observer.error，而是被恢复 Observable 替换</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 catchError 输出"}</span>
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
            <strong>恢复</strong>：catchError 返回新的 Observable，用默认值替代错误分支。
          </li>
          <li>
            <strong>流会中断</strong>：4 抛错后，上游原本的 5 不会继续到下游。
          </li>
          <li>
            <strong>也能重试</strong>：返回 caught$ 会重新订阅上游，但通常需要 take 等操作符限制次数。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="返回 caught$ 的重试写法" code={CAUGHT_CODE} />
    </div>
  );
}
