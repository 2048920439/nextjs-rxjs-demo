"use client";

import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "./page.module.scss";
import { TimedClickCounterDemoModel } from "./timed-click-counter-demo.model";

// sidebar-title: 7.1.5 计时的点击计数

const BOOK_CODE = `// 7.1.5 计时的点击计数网页程序
import { fromEvent, takeUntil, timer } from "rxjs";

const event$ = fromEvent(button, "click");
const countDown$ = timer(5000);
const filtered$ = event$.pipe(takeUntil(countDown$));

filtered$.subscribe(() => {
  clickCount += 1;
});

countDown$.subscribe(() => {
  showEnd();
});`;

const REACT_CODE = `// 本页面的 React 触发版本
const countDown$ = timer(5000);

const clickCount$ = clickSubject.pipe(
  takeUntil(countDown$),
  mapTo(1),
  scan((count, value) => count + value, 0),
);

clickCount$.subscribe(renderCount);`;

export default function TimedClickCounterPage() {
  const [demo] = useState(() => new TimedClickCounterDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const start = useCallback(() => demo.start(), [demo]);
  const click = useCallback(() => demo.click(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  const remainingSeconds = (state.remainingMs / 1000).toFixed(1);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>7.1.5 计时的点击计数网页程序</h1>
        <p className={styles.subtitle}>
          这个例子把点击事件流交给 takeUntil(countDown$)。5 秒倒计时结束后，countDown$ 触发，点击流 complete，之后的点击不再计数。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={start} disabled={state.running}>
                {state.running ? "计时中..." : state.ended ? "重新开始" : "开始计时"}
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.count === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>pipeline</span>
            <code>click$.pipe(takeUntil(timer(5000)), scan(...))</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.counterCard}>
              <span className={styles.cardMeta}>点击次数</span>
              <strong className={styles.countValue}>{state.count}</strong>
              <button className={styles.clickBtn} onClick={click} disabled={!state.running}>
                计数点击
              </button>
            </article>

            <article className={styles.timerCard}>
              <span className={styles.cardMeta}>剩余时间</span>
              <strong className={styles.timeValue}>{remainingSeconds}s</strong>
              <div className={styles.progressTrack}>
                <span style={{ width: `${Math.max(0, Math.min(100, (state.remainingMs / 5000) * 100))}%` }} />
              </div>
            </article>
          </div>

          <div className={styles.output}>
            <div className={styles.outputHeader}>
              <span>clickCount$ 输出</span>
              <small>{state.ended ? "已结束" : state.running ? "统计中" : "未开始"}</small>
            </div>
            {state.events.length === 0 ? (
              <p className={styles.empty}>{"// 开始计时后点击按钮，这里会显示 scan 后的累计值"}</p>
            ) : (
              state.events.map((event) => (
                <div key={`${event.count}-${event.at}`} className={styles.outputLine}>
                  <strong>{event.count}</strong>
                  <span>{event.at}</span>
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
            <strong>countDown$ 有两个角色</strong>：它既能驱动结束提示，也作为 takeUntil 的 notifier。
          </li>
          <li>
            <strong>takeUntil 管生命周期</strong>：倒计时触发后，点击流自动 complete，不需要手动 unsubscribe。
          </li>
          <li>
            <strong>scan 只负责计数</strong>：点击事件先被 takeUntil 限时，再被 scan 累加成数量。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例的 RxJS 7 写法" code={BOOK_CODE} />
      <CodeBlock title="本页面的 React 触发版本" code={REACT_CODE} />
    </div>
  );
}
