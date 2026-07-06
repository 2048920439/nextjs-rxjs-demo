"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { GroupByDemoModel } from "./group-by-demo.model";

// sidebar-title: 8.5.1 groupBy：按 key 拆成分组 Observable

const BOOK_CODE = `// 8.5.1 groupBy
import { groupBy, interval, map, mergeMap, take } from "rxjs";

const source$ = interval(1000).pipe(take(6));
const grouped$ = source$.pipe(groupBy((value) => value % 2));

const result$ = grouped$.pipe(
  mergeMap((group$) =>
    group$.pipe(map((value) => ({ key: group$.key, value }))),
  ),
);

result$.subscribe(console.log);
// { key: 0, value: 0 }
// { key: 1, value: 1 }
// { key: 0, value: 2 }
// ...`;

const DOM_CODE = `// DOM 事件按 className 分组
import { filter, fromEvent, groupBy, mergeAll } from "rxjs";

const click$ = fromEvent<MouseEvent>(document, "click");
const byClass$ = click$.pipe(
  groupBy((event) => (event.target as HTMLElement).className),
);

byClass$
  .pipe(filter((group$) => group$.key === "foo"), mergeAll())
  .subscribe(fooEventHandler);

byClass$
  .pipe(filter((group$) => group$.key === "bar"), mergeAll())
  .subscribe(barEventHandler);`;

export default function GroupByPage() {
  const [demo] = useState(() => new GroupByDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>8.5.1 groupBy：按 key 拆成分组 Observable</h1>
        <p className={styles.subtitle}>
          groupBy 会根据 keySelector 把一个上游流拆成高阶 Observable。每个不同 key 对应一个 GroupedObservable，同 key 的值会持续进入同一个分组。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={run} disabled={state.running}>
                运行
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>operator</span>
            <code>{"source$.pipe(groupBy((value) => value % 2 === 0 ? 'even' : 'odd'))"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$</h3>
              <p className={styles.cardMeta}>0 到 5，每 1000ms 发出一个；奇偶值交叉出现</p>
              <div className={styles.tokenRow}>
                {state.sourceValues.length === 0 ? (
                  <span className={styles.empty}>等待 source$ 发值</span>
                ) : (
                  state.sourceValues.map((item) => (
                    <span key={`${item.value}-${item.at}`} className={clsx(styles.token, item.key === "even" ? styles.passToken : styles.pendingToken)}>
                      {item.value}
                      <small>{item.key}</small>
                      <small>{item.at}</small>
                    </span>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>GroupedObservable</h3>
              <p className={styles.cardMeta}>第一次遇到新 key 时创建分组，之后复用同一个分组流</p>
              <div className={styles.outputList}>
                {state.groups.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 groupBy 创建分组"}</span>
                ) : (
                  state.groups.map((group) => (
                    <div key={group.key} className={styles.outputLine}>
                      <strong>{group.label}</strong>
                      <span>{group.values.length === 0 ? `opened ${group.openedAt}` : `[${group.values.join(", ")}]`}</span>
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
            <strong>输出高阶流</strong>：groupBy 的下游先收到分组 Observable，而不是普通值。
          </li>
          <li>
            <strong>key 决定归属</strong>：同一个 key 的数据会进入同一个 GroupedObservable。
          </li>
          <li>
            <strong>不同于 window</strong>：分组值可以交叉出现，不要求上游数据连续落在同一段窗口里。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="按 DOM className 分组事件" code={DOM_CODE} />
    </div>
  );
}
