"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { MergeMapDemoModel } from "./merge-map-demo.model";

// sidebar-title: 8.4.2 mergeMap：并发摊平高阶 Observable

const BOOK_CODE = `// 8.4.2 mergeMap
import { interval, mergeMap, take } from "rxjs";

const project = () => interval(1000).pipe(take(3));
const source$ = interval(200).pipe(take(2));

const result$ = source$.pipe(mergeMap(project));

// mergeMap = map + mergeAll
// 每个内部 Observable 都会被直接合并，不等待、不排队`;

const AJAX_CODE = `// 每次点击都发起一次 AJAX，请求结果到达就交给下游
const result$ = fromEvent(sendButton, "click").pipe(
  mergeMap(() => ajax.getJSON(apiUrl)),
);

result$.subscribe((result) => {
  renderResult(result);
});`;

export default function MergeMapPage() {
  const [demo] = useState(() => new MergeMapDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>8.4.2 mergeMap：并发摊平高阶 Observable</h1>
        <p className={styles.subtitle}>
          mergeMap 会把上游每个值映射成内部 Observable，并把所有内部流直接合并到下游。它不会等待前一个内部流完成，因此输出可以交叉出现。
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
            <code>{"source$.pipe(mergeMap((value) => inner$(value)))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>0、1、2 快速到达；每个值都会立即创建并订阅一个内部流</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span
                      key={`${item.value}-${item.at}`}
                      className={clsx(styles.token, state.activeInners.includes(item.value) ? styles.passToken : styles.dropToken)}
                    >
                      {item.value}
                      <small>{state.activeInners.includes(item.value) ? "active" : "done"}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>内部流并发输出，结果按实际到达时间进入下游</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 mergeMap 输出"}</span>
                ) : (
                  state.outputs.map((item) => (
                    <div key={`${item.label}-${item.at}`} className={styles.outputLine}>
                      <strong>{item.label}</strong>
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
            <strong>map + mergeAll</strong>：先映射成内部 Observable，再把所有内部流直接合并。
          </li>
          <li>
            <strong>并发优先</strong>：内部流之间不排队，哪个先产生值就先传给下游。
          </li>
          <li>
            <strong>适合独立异步任务</strong>：多个互不覆盖的 AJAX 请求、并行加载、事件触发任务都适合这个模式。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="AJAX 场景中的 mergeMap" code={AJAX_CODE} />
    </div>
  );
}
