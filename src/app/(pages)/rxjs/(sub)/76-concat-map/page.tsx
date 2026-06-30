"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { ConcatMapDemoModel } from "./concat-map-demo.model";

// sidebar-title: 8.4.1 concatMap：顺序摊平高阶 Observable

const BOOK_CODE = `// 8.4.1 concatMap
import { concatMap, interval, take } from "rxjs";

const project = () => interval(1000).pipe(take(3));
const source$ = interval(1000).pipe(take(3));

const result$ = source$.pipe(concatMap(project));

// concatMap = map + concatAll
// 前一个内部 Observable 完成后，才订阅下一个`;

const DRAG_CODE = `// 拖拽场景：一次 mousedown 对应一段 mousemove 流
const drag$ = mouseDown$.pipe(
  concatMap((startEvent) => {
    const stop$ = merge(mouseUp$, mouseOut$);

    return mouseMove$.pipe(
      takeUntil(stop$),
      map((moveEvent) => ({
        x: moveEvent.x - startEvent.x + initialLeft,
        y: moveEvent.y - startEvent.y + initialTop,
      })),
    );
  }),
);`;

export default function ConcatMapPage() {
  const [demo] = useState(() => new ConcatMapDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>8.4.1 concatMap：顺序摊平高阶 Observable</h1>
        <p className={styles.subtitle}>
          concatMap 会把上游每个值映射成内部 Observable，然后按顺序订阅这些内部流。只有当前内部流 complete 后，才会处理下一个内部流。
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
            <code>{"source$.pipe(concatMap((value) => inner$(value)))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>0、1、2 依次到达；每个值映射成一个 3 秒内部流</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span
                      key={`${item.value}-${item.at}`}
                      className={clsx(styles.token, state.activeOuter === item.value ? styles.passToken : styles.dropToken)}
                    >
                      {item.value}
                      <small>{state.activeOuter === item.value ? "active" : "queued"}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>输出不会交叉：先 inner0$，再 inner1$，最后 inner2$</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 concatMap 输出"}</span>
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
            <strong>map + concatAll</strong>：先把值映射成内部 Observable，再按顺序摊平。
          </li>
          <li>
            <strong>顺序优先</strong>：后来的内部流必须等待前一个内部流完成。
          </li>
          <li>
            <strong>适合串行动作</strong>：拖拽、排队保存、按顺序执行任务都适合这个模式。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="拖拽场景中的 concatMap" code={DRAG_CODE} />
    </div>
  );
}
