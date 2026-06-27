"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { DistinctDemoModel, type DistinctMode } from "./distinct-demo.model";

// sidebar-title: 7.2.4 distinct：过滤已出现过的值

const BOOK_CODE = `// 7.2.4 distinct
import { distinct, of } from "rxjs";

const source$ = of(0, 1, 1, 2, 0, 0, 1, 3, 3);
const distinct$ = source$.pipe(distinct());

distinct$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// 输出：0, 1, 2, 3, complete`;

const KEY_SELECTOR_CODE = `// 使用 keySelector 比较对象字段
import { distinct, of } from "rxjs";

const source$ = of(
  { name: "RxJS", version: "v4" },
  { name: "React", version: "v15" },
  { name: "React", version: "v16" },
  { name: "RxJS", version: "v5" },
);

const distinct$ = source$.pipe(distinct((x) => x.name));

// 输出 RxJS v4、React v15`;

const FLUSH_CODE = `// 第二个参数 flushes$ 可以清空内部 seen 集合
import { distinct, interval, map } from "rxjs";

const source$ = interval(100).pipe(map((x) => x % 1000));
const distinct$ = source$.pipe(distinct(undefined, interval(500)));`;

export default function DistinctPage() {
  const [demo] = useState(() => new DistinctDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: DistinctMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.2.4 distinct：过滤已出现过的值</h1>
        <p className={styles.subtitle}>distinct 会维护一个已出现 key 的集合。上游值对应的 key 第一次出现时会被转发；之后同一个 key 再出现都会被丢弃。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("primitive")} disabled={state.running}>
                数字去重
              </button>
              <button className={styles.secondaryBtn} onClick={() => run("key-selector")} disabled={state.running}>
                按 name
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{state.mode === "primitive" ? "source$.pipe(distinct())" : "source$.pipe(distinct((x) => x.name))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>key 第一次出现时 pass，之后 drop</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>选择一个场景运行</span>
                ) : (
                  state.sourceValues.map((item, index) => (
                    <span key={`${item.label}-${index}`} className={clsx(styles.token, item.passed ? styles.passToken : styles.dropToken)}>
                      {item.label}
                      <small>{item.passed ? "pass" : "drop"}</small>
                      <small>key:{item.keyValue}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>distinct$</h3>
              <p className={styles.cardMeta}>只保留第一次出现的 key</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 distinct 输出"}</span>
                ) : (
                  state.outputs.map((item, index) => (
                    <div key={`${item.label}-${index}`} className={styles.outputLine}>
                      <strong>{item.label}</strong>
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
            <strong>全局去重</strong>：只要 key 在整个订阅期间出现过，后续都会被过滤。
          </li>
          <li>
            <strong>keySelector 定制比较</strong>：对象流通常要指定用于去重的字段。
          </li>
          <li>
            <strong>注意内存</strong>：长时间不结束的流可能让 seen 集合越来越大，可用 flushes$ 清空。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="对象字段去重" code={KEY_SELECTOR_CODE} />
      <CodeBlock title="使用 flushes$ 清空 seen 集合" code={FLUSH_CODE} />
    </div>
  );
}
