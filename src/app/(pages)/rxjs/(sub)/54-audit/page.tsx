"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { AuditDemoModel } from "./audit-demo.model";

// sidebar-title: 7.2.2 audit：用 Observable 结束审计窗口

const BOOK_CODE = `// 7.2.2 audit
import { audit, concat, interval, mapTo, take, timer } from "rxjs";

const source$ = concat(
  interval(500).pipe(take(2), mapTo("A")),
  interval(1000).pipe(take(3), mapTo("B")),
  interval(500).pipe(take(3), mapTo("C")),
);

const durationSelector = () => timer(800);
const result$ = source$.pipe(audit(durationSelector));`;

const NOTIFIER_CODE = `// durationSelector 返回的 Observable 控制窗口何时结束
import { audit, fromEvent, interval } from "rxjs";

const close$ = fromEvent(closeButton, "click");
const source$ = interval(1000);

const result$ = source$.pipe(
  audit(() => close$),
);

// close$ 发值时，audit 输出当前窗口内最后一个 source$ 值。`;

const AUDIT_NOTE_CODE = `// audit 的 durationSelector 与 throttle 类似
const result$ = source$.pipe(
  audit((value) => timer(800)),
);

// 但 audit 输出窗口内最后一个值，而 throttle 输出窗口第一个值`;

export default function AuditPage() {
  const [demo] = useState(() => new AuditDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const start = useCallback(() => demo.start(), [demo]);
  const closeWindow = useCallback(() => demo.closeWindow(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.2.2 audit：用 Observable 结束审计窗口</h1>
        <p className={styles.subtitle}>audit(durationSelector) 把每个窗口的结束时机交给另一个 Observable；这个控制流发值时，它输出窗口内最后到来的上游值。</p>
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
            <code>{"source$.pipe(audit(() => close$))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>每 650ms 发值；Close 按钮就是 close$ 的 next</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item, index) => (
                    <span
                      key={`${item.value}-${item.at}-${index}`}
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
              <button className={styles.primaryBtn} onClick={closeWindow} disabled={!state.running || !state.windowOpen}>
                Close
              </button>
              <div className={styles.tokenRow}>
                {state.closes.length === 0 ? (
                  <span className={styles.empty}>等待 close$ 触发</span>
                ) : (
                  state.closes.map((at) => (
                    <span key={at} className={`${styles.token} ${styles.pendingToken}`}>
                      close
                      <small>{at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>Close 时输出当前窗口最后一个值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 点击 Close 后输出窗口最后值"}</span>
                ) : (
                  state.outputs.map((item, index) => (
                    <div key={`${item.value}-${item.at}-${index}`} className={styles.outputLine}>
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
            <strong>close$ 决定窗口结束</strong>：durationSelector 返回的流发值后，audit 输出候选值。
          </li>
          <li>
            <strong>输出最后值</strong>：这点与 throttle 的第一个值相反。
          </li>
          <li>
            <strong>完成不会补窗口</strong>：如果最后窗口还没结束，上游 complete 后不会强制输出候选值。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="手动 notifier 控制版本" code={NOTIFIER_CODE} />
      <CodeBlock title="与 throttle 的区别" code={AUDIT_NOTE_CODE} />
    </div>
  );
}
