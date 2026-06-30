"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { PluckDemoModel, type PluckMode } from "./pluck-demo.model";

// sidebar-title: 8.2.3 pluck：提取对象字段

const BOOK_CODE = `// 8.2.3 pluck
import { of, pluck } from "rxjs";

const source$ = of(
  { name: "RxJS", version: "v4" },
  { name: "React", version: "v15" },
  { name: "React", version: "v16" },
  { name: "RxJS", version: "v5" },
);

const result$ = source$.pipe(pluck("name"));

result$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// RxJS
// React
// React
// RxJS
// complete`;

const NESTED_CODE = `// 多个参数可以提取嵌套字段
import { fromEvent, pluck } from "rxjs";

const click$ = fromEvent(document, "click");
const clickedTagName$ = click$.pipe(pluck("target", "tagName"));`;

const MAP_CODE = `// RxJS 7 更推荐用 map 和可选链替代 pluck
import { map, of } from "rxjs";

const source$ = of(
  { name: "RxJS", version: "v4" },
  { name: "React", version: "v15" },
);

const result$ = source$.pipe(map((item) => item?.name));`;

export default function PluckPage() {
  const [demo] = useState(() => new PluckDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: PluckMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>8.2.3 pluck：提取对象字段</h1>
        <p className={styles.subtitle}>
          pluck 会从每个上游对象中取出指定字段，也可以沿着多个字段名提取嵌套属性。字段不存在时，它向下游发送 undefined，而不是直接抛错。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("name")} disabled={state.running}>
                name
              </button>
              <button className={styles.secondaryBtn} onClick={() => run("nested")} disabled={state.running}>
                嵌套字段
              </button>
              <button className={styles.secondaryBtn} onClick={() => run("missing")} disabled={state.running}>
                缺失字段
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{state.operatorLabel}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>每个对象被送进 pluck，目标字段被“拔”出来</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>选择一个字段场景运行</span>
                ) : (
                  state.sourceValues.map((item, index) => (
                    <span key={`${item.label}-${index}`} className={styles.token}>
                      {item.label}
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>输出被提取出的字段值</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 pluck 输出"}</span>
                ) : (
                  state.outputs.map((item, index) => (
                    <div key={`${item.label}-${item.at}-${index}`} className={styles.outputLine}>
                      <strong>{item.label}</strong>
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
            <strong>字段提取</strong>：<code>pluck(&quot;name&quot;)</code> 等价于从每个对象中读取 name。
          </li>
          <li>
            <strong>支持嵌套路径</strong>：<code>pluck(&quot;target&quot;, &quot;tagName&quot;)</code> 会读取 target.tagName。
          </li>
          <li>
            <strong>缺失字段输出 undefined</strong>：它不会因为路径中某一层不存在而抛错。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="嵌套字段提取" code={NESTED_CODE} />
      <CodeBlock title="map 和可选链替代 pluck" code={MAP_CODE} />
    </div>
  );
}
