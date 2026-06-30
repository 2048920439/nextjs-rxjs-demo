"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { MapDemoModel, type MapMode } from "./map-demo.model";

// sidebar-title: 8.2.1 map：映射每个上游值

const BOOK_CODE = `// 8.2.1 map
import { map, of } from "rxjs";

const source$ = of(3, 1, 4);
const mapFunc = function (value, index) {
  return \`\${value} \${this.separator} \${index}\`;
};
const context = { separator: ":" };

const result$ = source$.pipe(map(mapFunc, context));

result$.subscribe({
  next: console.log,
  complete: () => console.log("complete"),
});

// 3 : 0
// 1 : 1
// 4 : 2
// complete`;

const CLOSURE_CODE = `// 更推荐用闭包替代 thisArg
import { map, of } from "rxjs";

const source$ = of(3, 1, 4);
const context = { separator: ":" };

const mapFunc = ((separator) => {
  return (value, index) => \`\${value} \${separator} \${index}\`;
})(context.separator);

const result$ = source$.pipe(map(mapFunc));`;

export default function MapPage() {
  const [demo] = useState(() => new MapDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback((mode: MapMode) => demo.run(mode), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>8.2.1 map：映射每个上游值</h1>
        <p className={styles.subtitle}>map(project) 是最基础的转化类操作符。每当上游推送一个 next，project 都会收到当前值和下标，并把返回值继续推给下游。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={() => run("this-arg")} disabled={state.running}>
                thisArg
              </button>
              <button className={styles.secondaryBtn} onClick={() => run("closure")} disabled={state.running}>
                闭包
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{state.mode === "this-arg" ? "source$.pipe(map(mapFunc, context))" : "source$.pipe(map(createMapFunc(separator)))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>发出 3、1、4；map 会给 project 传入 value 和 index</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.index}-${item.at}`} className={styles.token}>
                      {item.value}
                      <small>{`index ${item.index}`}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>result$</h3>
              <p className={styles.cardMeta}>输出格式：value separator index</p>
              <div className={styles.outputList}>
                {state.outputs.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 map 输出"}</span>
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
            <strong>一进一出</strong>：上游每个 next 都会触发一次 project，下游收到 project 的返回值。
          </li>
          <li>
            <strong>index 从 0 开始</strong>：project 的第二个参数是当前值在本次订阅中的序号。
          </li>
          <li>
            <strong>避免依赖 thisArg</strong>：RxJS 7 保留它是为了兼容，实际代码优先用闭包。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="闭包替代 thisArg" code={CLOSURE_CODE} />
    </div>
  );
}
