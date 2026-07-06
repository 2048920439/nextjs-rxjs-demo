"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { FinalizeDemoModel, type FinalizeMode } from "./finalize-demo.model";

// sidebar-title: 9.3.4 finalize：finally 的 RxJS 7 写法

const BOOK_CODE = `// 9.3.4 finally 在 RxJS 7 中对应 finalize
import { catchError, finalize, map, of, range, retry } from "rxjs";

const final$ = range(1, 10).pipe(
  map(throwOnUnluckyNumber),
  retry(3),
  catchError(() => of(8)),
  finalize(() => console.log("finally")),
);

final$.subscribe(console.log);`;

const CLEANUP_CODE = `// finalize 不改变数据，只做收尾副作用
request$.pipe(
  finalize(() => {
    loadingSubject.next(false);
    releaseResource();
  }),
);`;

export default function FinalizePage() {
  const [demo] = useState(() => new FinalizeDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: FinalizeMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>9.3.4 finalize：finally 的 RxJS 7 写法</h1>
        <p className={styles.subtitle}>
          书中的 finally 操作符在 RxJS 7 中写作 finalize。它不改变 next 值，只在上游 complete、error 或订阅被释放时执行一次，适合关闭
          loading、释放资源和写收尾日志。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("complete")} disabled={state.running}>
                正常完成
              </button>
              <button className={styles.primaryBtn} onClick={() => run("recover")} disabled={state.running}>
                catchError 恢复
              </button>
              <button className={styles.primaryBtn} onClick={() => run("error")} disabled={state.running}>
                直接错误
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{"source$.pipe(finalize(() => cleanup()))"}</code>
          </div>

          <div className={styles.notifier}>
            <span>terminal</span>
            <strong>{state.events.length === 0 ? "等待终止信号" : state.events.map((item) => `${item.type}: ${item.message} @ ${item.at}`).join(" / ")}</strong>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>正常完成只发出 1、2、3；错误场景中 4 会触发 unlucky number 4</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={clsx(styles.token, item.value === 4 ? styles.pendingToken : styles.passToken)}>
                      {item.value}
                      <small>{item.value === 4 ? "error" : "next"}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>finalize 不会改变这些输出，只在终止后执行收尾回调</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 result$ 输出"}</span>
                ) : (
                  state.outputs.map((item) => (
                    <div key={`${item.value}-${item.at}`} className={styles.outputLine}>
                      <strong>{item.kind === "recovery" ? `fallback ${item.value}` : `next ${item.value}`}</strong>
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
            <strong>只做副作用</strong>：finalize 不能替换数据，也不会吞掉错误。
          </li>
          <li>
            <strong>终止时执行</strong>：complete、error、unsubscribe 都会触发 finalize。
          </li>
          <li>
            <strong>每条订阅一次</strong>：一次订阅链里 finalize 回调只执行一次。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="收尾清理场景" code={CLEANUP_CODE} />
    </div>
  );
}
