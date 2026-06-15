"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { RaceDemoModel } from "./race-demo.model";

// sidebar-title: 5.1.7 race：胜者通吃

const SOURCES = [
  {
    key: "source1",
    label: "source1$",
    cardClass: "source1Card",
    firstDelay: "500ms",
    period: "2000ms",
    note: "第一条先发出，后续较慢",
  },
  {
    key: "source2",
    label: "source2$",
    cardClass: "source2Card",
    firstDelay: "1000ms",
    period: "1000ms",
    note: "频率更快，但第一条晚 500ms",
  },
] as const;

const BOOK_CODE = `// 5.1.7 race：胜者通吃
import { race, timer } from "rxjs";
import { map } from "rxjs/operators";

const source1$ = timer(500, 2000).pipe(map((x) => x + "a"));
const source2$ = timer(1000, 1000).pipe(map((x) => x + "b"));
const winner$ = race(source1$, source2$);

winner$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// source2$ 频率更快，但第一条晚 500ms。
// race 只看谁先发出第一条数据，所以 source1$ 胜出。`;

const BOOK_CODE_RULE = `// race 一旦确定胜者，就退订其他输入 Observable
// 后续输出完全跟随胜者：next / error / complete 都来自胜者`;

export default function RacePage() {
  const [demo] = useState(() => new RaceDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.7 race：胜者通吃</h1>
        <p className={styles.subtitle}>race 会同时订阅多个 Observable，第一个发出数据的来源成为胜者；胜者后续数据被完整转发，其余来源会被立即退订。</p>
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
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.outputs.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {SOURCES.map((source) => {
              const values = source.key === "source1" ? state.source1Values : state.source2Values;
              const sourceStatus = source.key === "source1" ? state.source1Status : state.source2Status;
              const isWinner = state.winner === source.key;
              const isCancelled = state.winner !== null && !isWinner;

              return (
                <article
                  key={source.key}
                  className={clsx(styles.card, styles[source.cardClass], isWinner && styles.winnerCard, isCancelled && styles.cancelledCard)}
                >
                  <div className={styles.cardTop}>
                    <h3 className={styles.cardTitle}>{source.label}</h3>
                    <span className={styles.cardMeta}>{source.note}</span>
                  </div>

                  <div className={styles.badgeRow}>
                    <span className={styles.badge}>首次 {source.firstDelay}</span>
                    <span className={styles.badge}>间隔 {source.period}</span>
                    <span className={clsx(styles.badge, isWinner && styles.winnerBadge, isCancelled && styles.cancelledBadge)}>
                      {isWinner ? "胜者" : isCancelled ? "已退订" : "待竞争"}
                    </span>
                  </div>

                  <p className={styles.sourceStatus}>{sourceStatus}</p>

                  <div className={styles.tokenRow}>
                    {values.length === 0 ? (
                      <span className={styles.empty}>暂无发值</span>
                    ) : (
                      values.map((event) => (
                        <span key={`${source.key}-${event.value}-${event.at}`} className={styles.token}>
                          {event.value}
                          <small>{event.at}</small>
                        </span>
                      ))
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>winner$ 输出</span>
              <span className={styles.outputMeta}>确定胜者后，只剩一条来源继续向下游发值</span>
            </div>

            {state.outputs.length === 0 ? (
              <p className={styles.placeholder}>{"// 运行后这里会只看到 source1$ 的 0a, 1a, 2a..."}</p>
            ) : (
              state.outputs.map((event, index) => (
                <div key={`${event.source}-${event.value}-${index}`} className={styles.outputLine}>
                  <span className={styles.streamTag}>{event.source}</span>
                  <span className={styles.outputValue}>{event.value}</span>
                  <span className={styles.outputTime}>{event.at}</span>
                </div>
              ))
            )}
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>只看第一条数据</strong>：race 不比较整体频率，只比较谁最先发出第一个 next。
          </li>
          <li>
            <strong>胜者通吃</strong>：胜者确定后，下游完全跟随胜者 Observable。
          </li>
          <li>
            <strong>败者退订</strong>：其他输入会被取消订阅，通常连第一条数据都没有机会发出。
          </li>
        </ul>
      </aside>

      <CodeBlock title="RxJS 7 写法（延迟版，对应原书逻辑）" code={BOOK_CODE} />
      <CodeBlock title="退订规则" code={BOOK_CODE_RULE} />
    </div>
  );
}
