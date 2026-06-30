"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { ExhaustMapDemoModel } from "./exhaust-map-demo.model";

// sidebar-title: 8.4.4 exhaustMap：耗尽当前的内部 Observable

const BOOK_CODE = `// 8.4.4 exhaustMap
import { exhaustMap, interval, take } from "rxjs";

const project = () => interval(1000).pipe(take(3));
const source$ = interval(1000).pipe(take(3));

const result$ = source$.pipe(exhaustMap(project));

// exhaustMap = map + exhaustAll
// 当前内部 Observable 未完成时，新的上游值不会触发 project`;

const LONG_POLLING_CODE = `// 长连接或提交防重入：当前请求没结束前忽略重复触发
const messages$ = connectClick$.pipe(
  exhaustMap(() => ajax.getJSON("/api/messages/stream")),
);

messages$.subscribe((message) => {
  appendMessage(message);
});`;

export default function ExhaustMapPage() {
  const [demo] = useState(() => new ExhaustMapDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>8.4.4 exhaustMap：耗尽当前的内部 Observable</h1>
        <p className={styles.subtitle}>
          exhaustMap 会把上游值映射成内部 Observable，但当前内部流未完成时，后续上游值会被忽略。它坚持已经开始的工作，不被新的触发打断。
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
            <code>{"source$.pipe(exhaustMap((value) => request$(value)))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>request1$ 与 request0$ 重叠，因此不会进入下游；request2$ 会在空闲后被接受</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => {
                    const isIgnored = state.ignoredRequests.some((request) => request.id === item.value);
                    const isActive = state.activeRequest === item.value;
                    const isDone = state.outputs.some((output) => output.id === item.value);

                    return (
                      <span
                        key={`${item.value}-${item.at}`}
                        className={clsx(
                          styles.token,
                          isActive ? styles.passToken : isIgnored ? styles.pendingToken : isDone ? styles.passToken : styles.dropToken,
                        )}
                      >
                        request{item.value}$<small>{isActive ? "active" : isIgnored ? "ignored" : isDone ? "done" : "accepted"}</small>
                        <small>{item.at}</small>
                      </span>
                    );
                  })
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>只输出被接受的内部 Observable 结果</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 exhaustMap 输出"}</span>
                ) : (
                  state.outputs.map((item) => (
                    <div key={`${item.id}-${item.at}`} className={styles.outputLine}>
                      <strong>{`request${item.id}$`}</strong>
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
            <strong>map + exhaustAll</strong>：先映射成内部 Observable，再耗尽当前内部流。
          </li>
          <li>
            <strong>当前优先</strong>：当前内部流未完成时，新的上游值会被忽略，甚至不会调用 project。
          </li>
          <li>
            <strong>适合防重入</strong>：长连接、登录提交、保存按钮防重复点击都可以用这个策略。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="长连接场景中的 exhaustMap" code={LONG_POLLING_CODE} />
    </div>
  );
}
