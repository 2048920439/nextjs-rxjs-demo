"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { EndlessCounterModel } from "./endless-counter.model";
import styles from "./page.module.scss";

const BOOK_CODE = `import { Observable } from 'rxjs';

const source$ = new Observable((subscriber) => {
  const id = setInterval(() => subscriber.next(Date.now()), 1000);
  return () => clearInterval(id);
});`;

export default function EndlessObservablePage() {
  const [demo] = useState(() => new EndlessCounterModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const subscribe = useCallback(() => demo.subscribe(), [demo]);
  const unsubscribe = useCallback(() => demo.unsubscribe(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>2.2.5 永无止境的 Observable</h1>
        <p className={styles.subtitle}>Observable 可以持续发出数据但不主动结束，这类流必须由订阅者主动 unsubscribe。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>这个 Observable 每秒发射递增数字，除非手动取消订阅，否则不会 complete。</p>
            <div className={styles.actions}>
              {state.subscribed ? (
                <button className={styles.secondaryBtn} onClick={unsubscribe}>
                  取消订阅
                </button>
              ) : (
                <button className={styles.primaryBtn} onClick={subscribe}>
                  订阅
                </button>
              )}
            </div>
          </div>

          <div className={styles.counter}>{state.subscribed ? state.count : "-"}</div>

          <div className={styles.history}>
            {state.history.length === 0 ? (
              <span className={styles.placeholder}>等待订阅...</span>
            ) : (
              state.history.map((value) => (
                <span key={value} className={styles.historyDot}>
                  {value}
                </span>
              ))
            )}
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>不会自动结束</strong>：上游持续产生数据，下游会持续收到 next。
          </li>
          <li>
            <strong>退订很重要</strong>：无限流需要在不再使用时主动 unsubscribe。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
