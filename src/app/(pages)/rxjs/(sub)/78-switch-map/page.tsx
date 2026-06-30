"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { SwitchMapDemoModel } from "./switch-map-demo.model";

// sidebar-title: 8.4.3 switchMap：切换到最新的内部 Observable

const BOOK_CODE = `// 8.4.3 switchMap
import { interval, switchMap, take } from "rxjs";

const project = () => interval(1000).pipe(take(3));
const source$ = interval(200).pipe(take(2));

const result$ = source$.pipe(switchMap(project));

// switchMap = map + switchAll
// 新的内部 Observable 出现时，立刻退订旧的内部 Observable`;

const AJAX_CODE = `// 快速重复点击时，只让最新请求更新界面
const stars$ = refreshClick$.pipe(
  switchMap(() => ajax.getJSON("/api/repos/reactivex/rxjs/stars")),
);

stars$.subscribe((stars) => {
  renderStars(stars);
});`;

export default function SwitchMapPage() {
  const [demo] = useState(() => new SwitchMapDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>8.4.3 switchMap：切换到最新的内部 Observable</h1>
        <p className={styles.subtitle}>
          switchMap 会把上游值映射成内部 Observable，但它始终以最新的内部流为准。新的内部流出现时，之前还没完成的内部流会被退订。
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
            <code>{"source$.pipe(switchMap((value) => request$(value)))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>连续三次点击会触发 request0$、request1$、request2$</p>
              <div className={styles.tokenRow}>
                {state.requests.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.requests.map((request) => {
                    const isCancelled = state.cancelledRequests.includes(request.id);
                    const isActive = state.activeRequest === request.id;
                    const isDone = state.outputs.some((item) => item.id === request.id);

                    return (
                      <span
                        key={`${request.id}-${request.at}`}
                        className={clsx(
                          styles.token,
                          isActive ? styles.passToken : isCancelled ? styles.pendingToken : isDone ? styles.passToken : styles.dropToken,
                        )}
                      >
                        request{request.id}$<small>{isActive ? "active" : isCancelled ? "cancelled" : isDone ? "done" : "waiting"}</small>
                        <small>{request.at}</small>
                      </span>
                    );
                  })
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>只有最新且未被退订的请求会继续输出</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 switchMap 输出"}</span>
                ) : (
                  state.outputs.map((item) => (
                    <div key={`${item.id}-${item.at}`} className={styles.outputLine}>
                      <strong>{item.stars}</strong>
                      <span>{`request${item.id}$ · ${item.at}`}</span>
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
            <strong>map + switchAll</strong>：先映射成内部 Observable，再只订阅最新的内部流。
          </li>
          <li>
            <strong>最新优先</strong>：新请求发出后，旧请求即使稍后返回，也不会再更新下游。
          </li>
          <li>
            <strong>适合刷新类请求</strong>：搜索建议、详情刷新、重复点击加载最新数据都常用这个策略。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="AJAX 场景中的 switchMap" code={AJAX_CODE} />
    </div>
  );
}
