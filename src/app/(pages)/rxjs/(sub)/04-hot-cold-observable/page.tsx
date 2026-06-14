"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import { HotColdDemoModel, type ObserverRecord } from "./hot-cold-demo.model";
import styles from "./page.module.scss";

const BOOK_CODE = `// Cold: 每次订阅都重新执行上游
interval(1000).subscribe(observerA);
interval(1000).subscribe(observerB);

// Hot: 多个订阅者共享同一个 Subject
const subject = new Subject();
interval(1000).subscribe(subject);
subject.subscribe(observerA);
subject.subscribe(observerB);`;

function ObserverList({ observers, hot }: { observers: ObserverRecord[]; hot?: boolean }) {
  if (observers.length === 0) return <p className={styles.placeholder}>暂无观察者</p>;

  return observers.map((observer) => (
    <div key={observer.id} className={clsx(styles.observerCard, observer.completed && styles.observerCardCompleted)}>
      <span className={styles.observerId}>
        Observer #{observer.id}
        {hot && observer.joinedAt > 0 && <span className={styles.joinedTag}>加入于 {observer.joinedAt}</span>}
        {observer.completed && <span className={styles.completedTag}>已完成</span>}
      </span>
      <div className={styles.track}>
        {observer.values.length === 0 ? (
          <span className={styles.trackPending}>等待数据...</span>
        ) : (
          observer.values.map((value, index) => (
            <span key={`${value}-${index}`} className={clsx(styles.trackDot, hot ? styles.hotDot : styles.coldDot)}>
              {value}
            </span>
          ))
        )}
      </div>
    </div>
  ));
}

export default function HotColdObservablePage() {
  const [demo] = useState(() => new HotColdDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const addColdObserver = useCallback(() => demo.addColdObserver(), [demo]);
  const addHotObserver = useCallback(() => demo.addHotObserver(), [demo]);
  const resetCold = useCallback(() => demo.resetCold(), [demo]);
  const resetHot = useCallback(() => demo.resetHot(), [demo]);
  const resetAll = useCallback(() => demo.resetAll(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>2.4 Hot Observable 和 Cold Observable</h1>
        <p className={styles.subtitle}>Cold 每个订阅者独立执行上游；Hot 多个订阅者共享同一个生产者，晚来的只能收到后续值。</p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <article className={clsx(styles.panel, styles.coldPanel)}>
            <h3 className={styles.panelTitle}>Cold Observable</h3>
            <p className={styles.panelDesc}>每次订阅都重新创建独立数据流，从 1 开始。</p>
            <div className={styles.producerBar}>
              <span>生产者</span>
              <strong>{state.coldRunning ? "每个 Observer 独立生产" : "未启动"}</strong>
            </div>
            <div className={styles.observerList}>
              <ObserverList observers={state.coldObservers} />
            </div>
            <div className={styles.actionRow}>
              <button className={styles.primaryBtn} onClick={addColdObserver}>
                + 添加观察者
              </button>
              <button className={styles.secondaryBtn} onClick={resetCold}>
                重置
              </button>
            </div>
          </article>

          <article className={clsx(styles.panel, styles.hotPanel)}>
            <h3 className={styles.panelTitle}>Hot Observable</h3>
            <p className={styles.panelDesc}>多个观察者共享同一个上游，晚来的只看到后续数据。</p>
            <div className={styles.producerBar}>
              <span>共享生产者</span>
              <strong>{state.hotRunning ? `当前值 ${state.hotProducerValue}` : "未启动"}</strong>
            </div>
            <div className={styles.observerList}>
              <ObserverList observers={state.hotObservers} hot />
            </div>
            <div className={styles.actionRow}>
              <button className={styles.primaryBtn} onClick={addHotObserver}>
                + 添加观察者
              </button>
              <button className={styles.secondaryBtn} onClick={resetHot}>
                重置
              </button>
            </div>
          </article>
        </section>
        <button className={styles.resetBtn} onClick={resetAll}>
          全部重置
        </button>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>Cold</strong>：订阅触发独立执行，每个观察者拿到完整序列。
          </li>
          <li>
            <strong>Hot</strong>：生产者先存在，观察者共享同一份实时数据。
          </li>
        </ul>
      </aside>

      <CodeBlock title="原书示例" code={BOOK_CODE} />
    </div>
  );
}
