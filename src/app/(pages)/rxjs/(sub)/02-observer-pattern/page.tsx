"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { ObserverDemoModel } from "./observer-demo.model";
import styles from "./page.module.scss";

const BOOK_CODE = `import { of } from 'rxjs';

of(1, 2, 3).subscribe({
  next: value => console.log(value),
  complete: () => console.log('complete'),
});`;

export default function ObserverPatternPage() {
  const [demo] = useState(() => new ObserverDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const subscribe = useCallback(() => demo.subscribe(), [demo]);
  const unsubscribe = useCallback(() => demo.unsubscribe(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>2.2.1 观察者模式</h1>
        <p className={styles.subtitle}>Observable 负责产生数据，Observer 负责接收 next/error/complete 通知，两者通过 subscribe 建立连接。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <article className={styles.panel}>
            <h3 className={styles.panelTitle}>发布者 Observable</h3>
            <code className={styles.sourceBox}>of(1, 2, 3)</code>
            <div className={styles.emitQueue}>
              {[1, 2, 3].map((value) => (
                <span key={value} className={clsx(styles.emitDot, state.records.includes(value) && styles.dotEmitted)}>
                  {value}
                </span>
              ))}
            </div>
            {state.subscribed ? (
              <button className={styles.secondaryBtn} onClick={unsubscribe}>
                取消订阅
              </button>
            ) : (
              <button className={styles.primaryBtn} onClick={subscribe}>
                订阅
              </button>
            )}
          </article>

          <article className={styles.panel}>
            <h3 className={styles.panelTitle}>观察者 Observer</h3>
            <code className={styles.sourceBox}>next / complete</code>
            <div className={styles.output}>
              {state.records.length === 0 ? (
                <p className={styles.placeholder}>等待订阅...</p>
              ) : (
                state.records.map((record) => (
                  <div key={record} className={styles.outputLine}>
                    收到数据：<strong>{record}</strong>
                  </div>
                ))
              )}
              {state.completed && <div className={styles.complete}>complete</div>}
            </div>
          </article>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>Observable</strong>：定义数据如何产生。
          </li>
          <li>
            <strong>Observer</strong>：定义如何处理 next/error/complete。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
