"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { DebounceDemoModel } from "./debounce-demo.model";

// sidebar-title: 7.2.1 debounce：用数据流控制等待

const BOOK_CODE = `// 7.2.1 debounce
import { debounce, interval, timer } from "rxjs";

const source$ = interval(1000);
const durationSelector = (value) => {
  return timer(value % 3 === 0 ? 2000 : 1000);
};

const result$ = source$.pipe(debounce(durationSelector));

result$.subscribe(console.log);`;

const NOTIFIER_CODE = `// durationSelector 返回的 Observable 控制何时确认最新值
import { debounce, fromEvent, interval } from "rxjs";

const flush$ = fromEvent(flushButton, "click");
const source$ = interval(1000);

const result$ = source$.pipe(
  debounce(() => flush$),
);

// flush$ 发值时，当前等待中的最新 source$ 值进入下游。`;

const INDEX_NOTE_CODE = `// 原书提示：durationSelector 只有 value 参数，没有 index 参数
const durationSelector = (value) => {
  return timer(value % 3 === 0 ? 2000 : 1000);
};

// 不能写成 debounce((value, index) => timer(index * 2))`;

export default function DebouncePage() {
  const [demo] = useState(() => new DebounceDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const start = useCallback(() => demo.start(), [demo]);
  const flush = useCallback(() => demo.flush(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.2.1 debounce：用数据流控制等待</h1>
        <p className={styles.subtitle}>debounce(durationSelector) 会缓存最新值；这个值何时被确认进入下游，由 durationSelector 返回的 Observable 决定。</p>
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
            <code>{"source$.pipe(debounce(() => flush$))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>每 650ms 发值；Flush 按钮就是 flush$ 的 next</p>
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
              <button className={styles.primaryBtn} onClick={flush} disabled={!state.running || state.pendingValue === null}>
                Flush
              </button>
              <div className={styles.tokenRow}>
                {state.flushes.length === 0 ? (
                  <span className={styles.empty}>等待 flush$ 触发</span>
                ) : (
                  state.flushes.map((at) => (
                    <span key={at} className={`${styles.token} ${styles.pendingToken}`}>
                      flush
                      <small>{at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>Flush 时输出当前等待中的最新值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 点击 Flush 后输出最新值"}</span>
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
            <strong>flush$ 决定确认时机</strong>：durationSelector 返回的 Observable 发值后，最新值才进入下游。
          </li>
          <li>
            <strong>只保留最新</strong>：Flush 前的新 source$ 值会替换旧等待值。
          </li>
          <li>
            <strong>没有 index 参数</strong>：durationSelector 只能直接看到当前值。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="手动 notifier 控制版本" code={NOTIFIER_CODE} />
      <CodeBlock title="durationSelector 的参数限制" code={INDEX_NOTE_CODE} />
    </div>
  );
}
