"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { MapToDemoModel, type MapToMode } from "./map-to-demo.model";

// sidebar-title: 8.2.2 mapTo：映射为固定值

const BOOK_CODE = `// 8.2.2 mapTo
import { mapTo, of } from "rxjs";

const source$ = of(3, 1, 4);
const result$ = source$.pipe(mapTo("A"));

result$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// A
// A
// A
// complete`;

const MAP_CODE = `// mapTo(value) 可以理解为 map(() => value)
import { map, of } from "rxjs";

const source$ = of(3, 1, 4);
const result$ = source$.pipe(map(() => "A"));`;

export default function MapToPage() {
  const [demo] = useState(() => new MapToDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: MapToMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>8.2.2 mapTo：映射为固定值</h1>
        <p className={styles.subtitle}>mapTo(value) 不关心上游 next 的具体内容，只把每次 next 都映射成同一个固定值。它适合把事件或信号转成统一命令。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("map-to")} disabled={state.running}>
                mapTo
              </button>
              <button className={styles.secondaryBtn} onClick={() => run("map")} disabled={state.running}>
                map 写法
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{state.mode === "map-to" ? "source$.pipe(mapTo('A'))" : "source$.pipe(map(() => 'A'))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>发出 3、1、4；这些原值都会被忽略</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item, index) => (
                    <span key={`${item.value}-${item.at}-${index}`} className={`${styles.token} ${styles.dropToken}`}>
                      {item.value}
                      <small>ignore</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>每次上游 next 都输出固定值 A</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待固定值输出"}</span>
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
            <strong>固定输出</strong>：上游值是什么不重要，下游只收到传给 mapTo 的值。
          </li>
          <li>
            <strong>次数仍然保留</strong>：上游发出三次 next，下游也会得到三次固定值。
          </li>
          <li>
            <strong>现代写法</strong>：RxJS 7 仍保留 mapTo，但更推荐直接写 map(() =&gt; value)。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="等价的 map 写法" code={MAP_CODE} />
    </div>
  );
}
