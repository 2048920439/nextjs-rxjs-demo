"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { ForkJoinDemoModel } from "./fork-join-demo.model";
import styles from "./page.module.scss";

// sidebar-title: 5.1.9 forkJoin

const BOOK_CODE = `// 5.1.9 forkJoin
import { forkJoin, interval } from "rxjs";
import { map, take } from "rxjs/operators";

const source1$ = interval(1000).pipe(
  map((x) => x + "a"),
  take(1),
);

const source2$ = interval(1000).pipe(
  map((x) => x + "b"),
  take(3),
);

const result$ = forkJoin([source1$, source2$]);

result$.subscribe({
  next: console.log,
  error: (err) => console.log("Error: ", err),
  complete: () => console.log("complete"),
});

// 等 source2$ 完成后输出：[ "0a", "2b" ]`;

const PROMISE_CODE = `// forkJoin 类似 Observable 版本的 Promise.all
// 区别是：它取每个 Observable 完成前的最后一个值。
forkJoin([profile$, permissions$, settings$]).subscribe(([profile, permissions, settings]) => {
  renderPage(profile, permissions, settings);
});`;

export default function ForkJoinPage() {
  const [demo] = useState(() => new ForkJoinDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>5.1.9 forkJoin</h1>
        <p className={styles.subtitle}>forkJoin 会等待所有输入 Observable 完成，然后只输出一次：每个输入完成前的最后一个值。</p>
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
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && !state.result}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            <article className={clsx(styles.card, styles.source1Card)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>source1$</h3>
                <span className={styles.cardMeta}>1 秒后发出 0a，并立即完成</span>
              </div>
              <div className={styles.tokenRow}>
                {state.source1Values.length === 0 ? (
                  <span className={styles.empty}>等待发值</span>
                ) : (
                  state.source1Values.map((item) => (
                    <span key={`source1-${item.value}`} className={styles.token}>
                      {item.value}
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={clsx(styles.card, styles.source2Card)}>
              <div className={styles.cardTop}>
                <h3 className={styles.cardTitle}>source2$</h3>
                <span className={styles.cardMeta}>每秒发出一次，第三个值 2b 后完成</span>
              </div>
              <div className={styles.tokenRow}>
                {state.source2Values.length === 0 ? (
                  <span className={styles.empty}>等待发值</span>
                ) : (
                  state.source2Values.map((item) => (
                    <span key={`source2-${item.value}`} className={styles.token}>
                      {item.value}
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>forkJoin 输出</span>
              <span className={styles.outputMeta}>所有输入 complete 后，只取最后值</span>
            </div>

            {state.result ? (
              <div className={styles.resultLine}>
                <span className={styles.resultValue}>
                  [{state.result.source1}, {state.result.source2}]
                </span>
                <span className={styles.resultTime}>{state.result.at}</span>
              </div>
            ) : (
              <p className={styles.placeholder}>{"// 即使 source1$ 已经完成，也要继续等待 source2$"}</p>
            )}
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>等待全部完成</strong>：任意输入没 complete，forkJoin 都不会输出结果。
          </li>
          <li>
            <strong>只取最后值</strong>：中间值会被丢弃，最终只组合每个输入的最后一个 next。
          </li>
          <li>
            <strong>类似 Promise.all</strong>：适合并行请求多个资源后一次性渲染。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="典型使用场景" code={PROMISE_CODE} />
    </div>
  );
}
