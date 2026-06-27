"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { ThrottleTimeDemoModel } from "./throttle-time-demo.model";

// sidebar-title: 7.2.1 throttleTime：放行窗口第一个值

const BOOK_CODE = `// 7.2.1 throttleTime
import { interval, throttleTime } from "rxjs";

const source$ = interval(1000);
const result$ = source$.pipe(throttleTime(2000));

result$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// 输出：0, 2, 4...`;

const FILTER_COMPARE_CODE = `// 过滤后的低频流也可以通过 throttleTime
import { filter, interval, throttleTime } from "rxjs";

const source$ = interval(1000);
const filter$ = source$.pipe(filter((x) => x % 3 === 0));
const result$ = filter$.pipe(throttleTime(2000));

// 输出仍是：0, 3, 6...，但它会在收到值时立刻输出`;

const IRREGULAR_CODE = `// 不固定频率数据流中的 throttleTime
import { concat, interval, mapTo, take, throttleTime } from "rxjs";

const source$ = concat(
  interval(500).pipe(take(2), mapTo("A")),
  interval(1000).pipe(take(3), mapTo("B")),
  interval(500).pipe(take(3), mapTo("C")),
);

const result$ = source$.pipe(throttleTime(800));`;

const DOM_CODE = `// DOM 事件限频：一秒内最多响应一次添加购物车
import { fromEvent, throttleTime } from "rxjs";

const click$ = fromEvent(addToCartButton, "click");
click$.pipe(throttleTime(1000)).subscribe(addToCartHandler);`;

export default function ThrottleTimePage() {
  const [demo] = useState(() => new ThrottleTimeDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.2.1 throttleTime：放行窗口第一个值</h1>
        <p className={styles.subtitle}>
          throttleTime(duration) 在放行一个值后关闭通道。关闭期间的上游值会被丢弃，直到 duration 时间过去，下一个到来的值才能再次进入下游。
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
            <code>source$.pipe(throttleTime(900))</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>每 450ms 发出 0 到 7；窗口内后续值会被丢弃</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={clsx(styles.token, item.passed ? styles.passToken : styles.dropToken)}>
                      {item.value}
                      <small>{item.passed ? "pass" : "drop"}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>只收到每个节流窗口的第一个值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待第一个窗口打开"}</span>
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
            <strong>先输出再计时</strong>：第一个值会立刻进入下游，然后开始 duration 窗口。
          </li>
          <li>
            <strong>窗口内丢弃</strong>：窗口关闭期间不会缓存最后一个值。
          </li>
          <li>
            <strong>适合限频</strong>：例如按钮连点、mousemove 采样式渲染。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="与过滤后低频流组合" code={FILTER_COMPARE_CODE} />
      <CodeBlock title="不固定频率数据流" code={IRREGULAR_CODE} />
      <CodeBlock title="DOM 事件限频" code={DOM_CODE} />
    </div>
  );
}
