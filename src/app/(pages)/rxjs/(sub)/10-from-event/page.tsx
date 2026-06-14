"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { ClickCounterModel } from "./click-counter.model";
import styles from "./page.module.scss";

const BOOK_CODE = `// 4.3.4 fromEvent
import { fromEvent } from 'rxjs';
import { map, scan } from 'rxjs/operators';

const click$ = fromEvent(button, 'click').pipe(
  map(() => 1),
  scan((count, value) => count + value, 0),
);`;

export default function FromEventPage() {
  const [demo] = useState(() => new ClickCounterModel());
  const count = useObservableState(demo.count$, () => demo.count);

  useEffect(() => () => demo.dispose(), [demo]);

  const click = useCallback(() => demo.click(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>4.3.4 fromEvent：DOM 事件流</h1>
        <p className={styles.subtitle}>fromEvent 可以把点击、键盘、滚动等事件包装成 Observable，再交给 RxJS 管线处理。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>点击和重置都进入同一条流，由 scan 计算当前次数。</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={click}>
                点我
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={count === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <span className={styles.cardMeta}>点击次数</span>
              <strong className={styles.cardValue}>{count}</strong>
            </article>
            <article className={styles.card}>
              <span className={styles.cardMeta}>流状态</span>
              <strong className={styles.cardValue}>{count > 0 ? "active" : "idle"}</strong>
            </article>
          </div>

          <div className={styles.output}>
            <code>merge(click$, reset$).pipe(scan(...))</code>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>事件即数据</strong>：每次点击都是流中的一个值。
          </li>
          <li>
            <strong>状态由流推导</strong>：scan 负责把事件序列折叠成计数。
          </li>
          <li>
            <strong>热 Observable</strong>：DOM 事件源本身是持续存在的热源。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
