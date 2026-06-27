"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { DebounceTimeDemoModel } from "./debounce-time-demo.model";

// sidebar-title: 7.2.1 debounceTime：等待上游安静

const BOOK_CODE = `// 7.2.1 debounceTime
import { debounceTime, filter, interval } from "rxjs";

const source$ = interval(1000);
const filter$ = source$.pipe(filter((x) => x % 3 === 0));
const result$ = filter$.pipe(debounceTime(2000));

result$.subscribe(console.log);

// 输出：0, 3, 6...，每个值都会延后确认`;

const NO_OUTPUT_CODE = `// 如果上游一直比 dueTime 更快，就不会输出
import { debounceTime, interval } from "rxjs";

const source$ = interval(1000);
const result$ = source$.pipe(debounceTime(2000));

result$.subscribe(console.log);

// source$ 不停止时，debounceTime 一直被重置`;

const IRREGULAR_CODE = `// 不固定频率的数据流
import { concat, debounceTime, interval, mapTo, take } from "rxjs";

const source$ = concat(
  interval(500).pipe(take(2), mapTo("A")),
  interval(1000).pipe(take(3), mapTo("B")),
  interval(500).pipe(take(3), mapTo("C")),
);

const result$ = source$.pipe(debounceTime(800));`;

const SCROLL_CODE = `// DOM 事件防抖：滚动停止 200ms 后再处理
import { debounceTime, fromEvent } from "rxjs";

const scroll$ = fromEvent(window, "scroll");
scroll$.pipe(debounceTime(200)).subscribe(scrollHandler);`;

export default function DebounceTimePage() {
  const [demo] = useState(() => new DebounceTimeDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.2.1 debounceTime：等待上游安静</h1>
        <p className={styles.subtitle}>
          debounceTime(dueTime) 会缓存最新值。只有当这个值之后的 dueTime 时间内没有新值到来，它才会进入下游；如果新值先到，旧值会被替换。
        </p>
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
            <code>source$.pipe(debounceTime(800))</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>A 段和 C 段频率太快，只有安静后的最新值能通过</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span
                      key={`${item.value}-${item.at}`}
                      className={clsx(
                        styles.token,
                        item.state === "passed" && styles.passToken,
                        item.state === "dropped" && styles.dropToken,
                        item.state === "pending" && styles.pendingToken,
                      )}
                    >
                      {item.value}
                      <small>{item.state}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>输出每段突发后的最后一个值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 800ms 安静窗口"}</span>
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
            <strong>先等再输出</strong>：每个值都要等 dueTime 确认后续没有新值。
          </li>
          <li>
            <strong>只保留最新</strong>：等待期间的新值会替换旧值。
          </li>
          <li>
            <strong>适合停止后处理</strong>：例如滚动停止、输入停顿后的请求。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="持续高频上游不会输出" code={NO_OUTPUT_CODE} />
      <CodeBlock title="不固定频率数据流" code={IRREGULAR_CODE} />
      <CodeBlock title="DOM 事件防抖" code={SCROLL_CODE} />
    </div>
  );
}
