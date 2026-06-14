"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { MergeDemoModel } from "./merge-demo.model";
import styles from "./page.module.scss";

const SOURCES = [
  { key: "source1", label: "source1$", cardClass: "source1Card", interval: 500, count: 4, prefix: "A" },
  { key: "source2", label: "source2$", cardClass: "source2Card", interval: 240, count: 4, prefix: "B" },
  { key: "source3", label: "source3$", cardClass: "source3Card", interval: 180, count: 3, prefix: "C" },
] as const;

const BOOK_CODE = `// 5.1.2 merge：先到先得
import { merge, of } from 'rxjs';

const source1$ = of(1, 2, 3);
const source2$ = of(4, 5, 6);
const merged$ = merge(source1$, source2$);

merged$.subscribe(console.log);
// merge 会同时订阅输入流，并把到达的数据立刻转发`;

const BOOK_CODE_MORE = `// merge 适合把多个事件入口汇入同一条处理管线
const click$ = fromEvent(button, 'click');
const key$ = fromEvent(document, 'keydown');

merge(click$, key$).subscribe(handleAction);`;

export default function MergePage() {
  const [demo] = useState(() => new MergeDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const sourceCards = useMemo(
    () =>
      SOURCES.map((source) => ({
        ...source,
        note: source.key === "source1" ? "更慢，但会和其他流一起启动" : source.key === "source2" ? "中等速度" : "最快，通常最先抢到输出",
      })),
    [],
  );

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.2 merge：先到先得</h1>
        <p className={styles.subtitle}>merge 会同时订阅多个输入流，任何一个流产生数据都会立刻转发给下游，输出顺序只取决于真实到达时间。</p>
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
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.logs.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            {sourceCards.map((source) => (
              <article key={source.key} className={clsx(styles.card, styles[source.cardClass])}>
                <div className={styles.cardTop}>
                  <h3 className={styles.cardTitle}>{source.label}</h3>
                  <span className={styles.cardMeta}>{source.note}</span>
                </div>
                <p className={styles.cardDesc}>
                  以 <strong>{source.interval}ms</strong> 间隔吐出 <strong>{source.count}</strong> 个值，格式是 {source.prefix}1, {source.prefix}2...
                </p>
              </article>
            ))}
          </div>

          <div className={styles.output}>
            {state.logs.length === 0 ? (
              <p className={styles.placeholder}>{"// 运行后这里会显示 merge 的交叉输出"}</p>
            ) : (
              state.logs.map((item, index) => (
                <div key={`${item.stream}-${index}`} className={styles.line}>
                  {item.stream === "system" ? (
                    <span className={styles.systemLine}>{item.value}</span>
                  ) : (
                    <>
                      <span className={clsx(styles.streamTag, styles[`${item.stream}Tag`])}>{item.stream}</span>
                      <span className={styles.value}>{item.value}</span>
                    </>
                  )}
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
            <strong>并行订阅</strong>：merge 会同时启动所有输入 Observable。
          </li>
          <li>
            <strong>到达即转发</strong>：哪个流先产生值，下游就先收到哪个值。
          </li>
          <li>
            <strong>全部完成才结束</strong>：所有输入流 complete 后，merge 的输出流才 complete。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
      <CodeBlock title="事件入口汇流" code={BOOK_CODE_MORE} />
    </div>
  );
}
