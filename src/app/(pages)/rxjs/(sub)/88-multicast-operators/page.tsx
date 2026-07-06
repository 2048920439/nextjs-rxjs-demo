"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { type MulticastOperatorMode, MulticastOperatorsDemoModel } from "./multicast-operators-demo.model";

// sidebar-title: 10.4 支持多播的操作符

const MODE_LABEL: Record<MulticastOperatorMode, string> = {
  multicast: "multicast",
  publish: "publish",
  share: "share",
};

const MODE_RULE: Record<MulticastOperatorMode, string> = {
  multicast: "source$.pipe(multicast(new Subject())) -> connect()",
  publish: "source$.pipe(publish(), refCount())",
  share: "source$.pipe(share())",
};

const BOOK_CODE = `// 10.4 支持多播的操作符：RxJS 7 pipe 写法
import { Subject, interval, multicast, publish, refCount, share, take } from "rxjs";

const coldSource$ = interval(1000).pipe(take(3));

const multicastTick$ = coldSource$.pipe(multicast(new Subject<number>()));
multicastTick$.subscribe((value) => console.log("observer 1:", value));
setTimeout(() => multicastTick$.subscribe((value) => console.log("observer 2:", value)), 1500);
multicastTick$.connect();

const publishTick$ = coldSource$.pipe(publish(), refCount());
const shareTick$ = coldSource$.pipe(share());`;

const RXJS7_NOTE = `// RxJS 7 中，这些旧多播 API 已经偏兼容用法
// publish().refCount() 的核心语义可以用 share 配置表达：
source$.pipe(
  share({
    resetOnError: false,
    resetOnComplete: false,
    resetOnRefCountZero: false,
  }),
);

// 常见的“多 Observer 共享上游，完成后可重新来一轮”直接写：
source$.pipe(share());`;

export default function MulticastOperatorsPage() {
  const [demo] = useState(() => new MulticastOperatorsDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: MulticastOperatorMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  const sourceSummary = useMemo(() => {
    const subscribes = state.sourceEvents.filter((event) => event.type === "subscribe").length;
    const values = state.sourceEvents.filter((event) => event.type === "next").map((event) => `${event.value}@#${event.cycle}`);

    return values.length === 0 ? `${subscribes} 次 source$ 订阅` : `${subscribes} 次 source$ 订阅 / ${values.join(", ")}`;
  }, [state.sourceEvents]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>10.4 支持多播的操作符</h1>
        <p className={styles.subtitle}>
          这一节把 Subject 的多播能力封装成操作符：multicast 暴露 connect 时机，publish 是 multicast(new Subject()) 的简化形式，share
          是最常用的自动连接和自动重置写法。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("multicast")} disabled={state.running}>
                multicast
              </button>
              <button className={styles.primaryBtn} onClick={() => run("publish")} disabled={state.running}>
                publish
              </button>
              <button className={styles.primaryBtn} onClick={() => run("share")} disabled={state.running}>
                share
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceEvents.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{MODE_RULE[state.mode]}</code>
          </div>

          <div className={styles.notifier}>
            <span>{MODE_LABEL[state.mode]}</span>
            <strong>{sourceSummary}</strong>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>每次真正订阅上游都会记录一个 #cycle；共享成功时，多个 Observer 只会看到同一个 cycle。</p>
              <div className={styles.tokenRow}>
                {state.sourceEvents.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 被订阅</span>
                ) : (
                  state.sourceEvents.map((event, index) => (
                    <span
                      key={`${event.type}-${event.cycle}-${event.value ?? "end"}-${index}`}
                      className={clsx(
                        styles.token,
                        event.type === "next" ? styles.passToken : event.type === "complete" ? styles.dropToken : styles.pendingToken,
                      )}
                    >
                      {event.type === "next" ? event.value : event.type}
                      <small>{`#${event.cycle}`}</small>
                      <small>{event.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>Observers</h3>
              <p className={styles.cardMeta}>observer 1 立即订阅；multicast 模式下 observer 2 在 1500ms 加入，另外两种模式在 5000ms 加入。</p>
              <div className={styles.outputList}>
                {state.observerEvents.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 Observer 输出"}</span>
                ) : (
                  state.observerEvents.map((event, index) => (
                    <div key={`${event.observer}-${event.type}-${event.value ?? "end"}-${index}`} className={styles.outputLine}>
                      <strong>{event.value ?? event.type}</strong>
                      <span>{`${event.observer} / ${event.at}`}</span>
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
            <strong>multicast</strong>：返回 ConnectableObservable，不调用 connect 就不会订阅上游。
          </li>
          <li>
            <strong>publish</strong>：简化了 multicast(new Subject())，但那个 Subject 完成后不能复用。
          </li>
          <li>
            <strong>share</strong>：用 Subject 工厂和 refCount 自动管理连接，是实际项目里更常用的多播入口。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="RxJS 7 多播 API 说明" code={RXJS7_NOTE} />
    </div>
  );
}
