"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { PatternDemoModel } from "./pattern-demo.model";

const BOOK_CODE = `// 4.3.5 fromEventPattern
import { fromEventPattern } from 'rxjs';

const source$ = fromEventPattern(
  (handler) => emitter.on('msg', handler),
  (handler) => emitter.off('msg', handler),
);`;

export default function FromEventPatternPage() {
  const [demo] = useState(() => new PatternDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const subscribe = useCallback(() => demo.subscribe(), [demo]);
  const emit = useCallback(() => demo.emit(), [demo]);
  const unsubscribe = useCallback(() => demo.unsubscribe(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.5 fromEventPattern：自定义事件源</h1>
        <p className={styles.subtitle}>fromEventPattern 用 addHandler/removeHandler 把任意回调式事件源包装成 Observable。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.subscribed ? "已订阅：发送数据会触发 addHandler 注册的回调" : "未订阅：先注册事件处理器"}</p>
            <div className={styles.actions}>
              {!state.subscribed ? (
                <button className={styles.primaryBtn} onClick={subscribe}>
                  订阅 fromEventPattern
                </button>
              ) : (
                <>
                  <button className={styles.primaryBtn} onClick={emit}>
                    发送数据
                  </button>
                  <button className={styles.secondaryBtn} onClick={unsubscribe}>
                    取消订阅
                  </button>
                </>
              )}
            </div>
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span className={styles.outputTitle}>事件日志</span>
              <span className={styles.outputMeta}>addHandler / removeHandler / next</span>
            </div>
            {state.logs.length === 0 ? (
              <p className={styles.placeholder}>点击“订阅”开始</p>
            ) : (
              state.logs.map((entry, index) => (
                <div key={`${entry.type}-${index}`} className={clsx(styles.outputLine, entry.type === "val" ? styles.logVal : styles.logNote)}>
                  {entry.type === "note" ? `// ${entry.text}` : entry.text}
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
            <strong>订阅时 add</strong>：subscribe 会调用 addHandler 注册回调。
          </li>
          <li>
            <strong>退订时 remove</strong>：unsubscribe 会调用 removeHandler 移除回调。
          </li>
          <li>
            <strong>兼容任意事件源</strong>：只要能注册/移除回调，就能封装成 Observable。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
