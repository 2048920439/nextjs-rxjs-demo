"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { ThrottleDemoModel } from "./throttle-demo.model";

// sidebar-title: 7.2.1 throttle：用数据流控制节流

const BOOK_CODE = `// 7.2.1 throttle
import { interval, throttle, timer } from "rxjs";

const source$ = interval(1000);
const durationSelector = (value) => {
  return timer(2000);
};

const result$ = source$.pipe(throttle(durationSelector));

result$.subscribe(console.log);

// 输出类似 throttleTime(2000)：0, 2, 4...`;

const NOTIFIER_CODE = `// durationSelector 返回的 Observable 控制何时重新打开通道
import { fromEvent, interval, throttle } from "rxjs";

const release$ = fromEvent(releaseButton, "click");
const source$ = interval(1000);

const result$ = source$.pipe(
  throttle(() => release$),
);

// source$ 的第一个值会通过；之后必须等 release$ 发值。`;

const DYNAMIC_CODE = `// durationSelector 也可以按当前值返回不同的 Observable
const durationSelector = (value) => {
  return timer(value % 3 === 0 ? 2000 : 1000);
};

const result$ = source$.pipe(throttle(durationSelector));`;

export default function ThrottlePage() {
  const [demo] = useState(() => new ThrottleDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const start = useCallback(() => demo.start(), [demo]);
  const release = useCallback(() => demo.release(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.2.1 throttle：用数据流控制节流</h1>
        <p className={styles.subtitle}>
          throttle(durationSelector) 和 throttleTime 一样先放行值再关闭通道；区别是通道何时重新打开，由 durationSelector 返回的 Observable 决定。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={start} disabled={state.running}>
                {state.running ? "运行中..." : "开始"}
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>durationSelector</span>
            <code>{"source$.pipe(throttle(() => release$))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>每 650ms 发值；Release 按钮就是 release$ 的 next</p>
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
              <button className={styles.primaryBtn} onClick={release} disabled={!state.running || !state.gateClosed}>
                Release
              </button>
              <div className={styles.tokenRow}>
                {state.releases.length === 0 ? (
                  <span className={styles.empty}>等待 release$ 触发</span>
                ) : (
                  state.releases.map((at) => (
                    <span key={at} className={`${styles.token} ${styles.pendingToken}`}>
                      release
                      <small>{at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>每次通道打开后收到第一个 source$ 值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 throttle 放行"}</span>
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
            <strong>release$ 决定窗口</strong>：durationSelector 返回的 Observable 第一次 next 后，通道重新打开。
          </li>
          <li>
            <strong>窗口关闭时丢值</strong>：Release 前到来的 source$ 值都会被丢弃。
          </li>
          <li>
            <strong>仍然先放行</strong>：throttle 的放行时机和 throttleTime 一致。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="手动 notifier 控制版本" code={NOTIFIER_CODE} />
      <CodeBlock title="按数据动态改变节流时间" code={DYNAMIC_CODE} />
    </div>
  );
}
