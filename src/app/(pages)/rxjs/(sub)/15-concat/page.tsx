"use client";

import clsx from "clsx";
import { useCallback, useEffect, useMemo, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { ConcatDemoModel } from "./concat-demo.model";
import styles from "./page.module.scss";

const SOURCES = [
  { key: "source1", label: "source1$", cardClass: "source1Card", interval: 500, count: 3, prefix: "A" },
  { key: "source2", label: "source2$", cardClass: "source2Card", interval: 240, count: 3, prefix: "B" },
  { key: "source3", label: "source3$", cardClass: "source3Card", interval: 180, count: 2, prefix: "C" },
] as const;

const BOOK_CODE = `// 5.1.1 concat：首尾相连
import { concat, of } from 'rxjs';

const source1$ = of(1, 2, 3);
const source2$ = of(4, 5, 6);
const concated$ = concat(source1$, source2$);

concated$.subscribe(console.log);
// 输出：1, 2, 3, 4, 5, 6
// 注意：第二个流必须等第一个流 complete 后才会开始`;

const BOOK_CODE_MORE = `// concat 可以连接任意多个 Observable
const source1$ = of(1, 2, 3);
const source2$ = of(4, 5, 6);
const source3$ = of(7, 8, 9);

const concated$ = concat(source1$, source2$, source3$);

// 如果前一个 Observable 永远不 complete，
// 后面的 Observable 永远没有机会被订阅`;

export default function ConcatPage() {
  const [demo] = useState(() => new ConcatDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const sourceCards = useMemo(
    () =>
      SOURCES.map((source) => ({
        ...source,
        note: source.key === "source1" ? "先完成的流" : source.key === "source2" ? "更快，但必须等待 source1 完成" : "最后接力的流",
      })),
    [],
  );

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.1 concat：首尾相连</h1>
        <p className={styles.subtitle}>concat 的核心规则只有一条：前一个流 complete 之后，才会订阅下一个流。它强调的是“完成顺序”，不是“谁先到谁先出”。</p>
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
              <p className={styles.placeholder}>{"// 运行后这里会显示 concat 的输出顺序"}</p>
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
            <strong>顺序订阅</strong>：concat 会先完整转发第一个 Observable，等它 complete 后再开始第二个。
          </li>
          <li>
            <strong>不会并行合并</strong>：后面的流即使更快，也不会抢先输出。
          </li>
          <li>
            <strong>依赖 complete</strong>：如果前一个流不结束，后面的流永远没有机会被订阅。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
      <CodeBlock title="多个流串联与注意事项" code={BOOK_CODE_MORE} />
    </div>
  );
}
