"use client";

import { useUnmount } from "ahooks";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { Observable, Subscription } from "rxjs";

import styles from "./styles.module.scss";

interface ObserverRecord {
  id: number;
  values: number[];
  joinedAt: number; // 加入时热源的当前值快照
  completed?: boolean; // Cold Observer 是否已完成
}

/** 冷/热数据源发射上限 */
const EMIT_LIMIT = 10;
/** 发射间隔 ms */
const EMIT_INTERVAL = 1000;

/**
 * 2.4 Hot Observable 和 Cold Observable 交互演示
 *
 * 所有数据流均使用 new Observable(subscriber => {...}) 手动构造，
 * 不依赖操作符（pipe / map / interval 等），与 2.4 章节的 API 知识面保持一致。
 *
 * - Cold（左）：每次 subscribe 创建一个新的"生产者"，Observer 从 1 开始收到完整序列
 * - Hot（右）：共享一个"生产者"，后来者只收到订阅之后产生的数据
 */
export default function HotColdDemo() {
  const [coldRunning, setColdRunning] = useState(false);
  const [hotRunning, setHotRunning] = useState(false);
  const [coldObservers, setColdObservers] = useState<ObserverRecord[]>([]);
  const [hotObservers, setHotObservers] = useState<ObserverRecord[]>([]);
  const [hotProducerValue, setHotProducerValue] = useState(0);
  const coldSubsRef = useRef<Subscription[]>([]);
  const hotSubsRef = useRef<Subscription[]>([]);

  // Hot 共享生产者 — 模拟 Subject 的 observer 列表但只用 new Observable 实现
  const hotProducerRef = useRef<{
    counter: number;
    observers: Array<{ next(v: number): void }>;
    handle: ReturnType<typeof setInterval> | null;
  } | null>(null);
  const observerIdRef = useRef(0);

  // ---- Cold: 每次 subscribe 在 Observable 构造器内新建 setInterval ——"冷"生产者 ----
  const addColdObserver = useCallback(() => {
    if (!coldRunning) setColdRunning(true);
    const id = ++observerIdRef.current;
    const record: ObserverRecord = { id, values: [], joinedAt: 0 };

    setColdObservers((prev) => [...prev, record]);

    // 手动构造 Observable → 每次 subscribe 都会执行一次 subscriber => {...}
    const source$ = new Observable<number>((subscriber) => {
      let value = 1;
      const handle = setInterval(() => {
        subscriber.next(value);
        value++;
        if (value > EMIT_LIMIT) {
          subscriber.complete();
          clearInterval(handle);
        }
      }, EMIT_INTERVAL);
      // teardown: unsubscribe 时清除定时器
      return () => clearInterval(handle);
    });

    const sub = source$.subscribe({
      next: (v) => {
        setColdObservers((prev) => prev.map((r) => (r.id === id ? { ...r, values: [...r.values, v] } : r)));
      },
      complete: () => {
        setColdObservers((prev) => {
          const next = prev.map((r) => (r.id === id ? { ...r, completed: true } : r));
          if (next.every((r) => r.completed)) setColdRunning(false);
          return next;
        });
      },
    });
    coldSubsRef.current.push(sub);
  }, [coldRunning]);

  // ---- Hot: 启动共享生产者（只执行一次 setInterval） ----
  const ensureHotProducer = useCallback(() => {
    if (hotProducerRef.current) return;

    let counter = 1;
    const observers: Array<{ next(v: number): void }> = [];

    const handle = setInterval(() => {
      const val = counter++;
      setHotProducerValue(val);
      observers.forEach((obs) => obs.next(val));
    }, EMIT_INTERVAL);

    hotProducerRef.current = { counter, observers, handle };
  }, []);

  const addHotObserver = useCallback(() => {
    if (!hotRunning) setHotRunning(true);
    ensureHotProducer();

    const id = ++observerIdRef.current;
    const joinedAt = hotProducerValue;
    const record: ObserverRecord = { id, values: [], joinedAt };

    setHotObservers((prev) => [...prev, record]);

    // Hot Observable 的本质：subscribe 只是把 Observer 连接上已存在的生产者
    const source$ = new Observable<number>((subscriber) => {
      const producer = hotProducerRef.current!;
      producer.observers.push(subscriber);
      // teardown: 从共享列表中移除自己
      return () => {
        const idx = producer.observers.indexOf(subscriber);
        if (idx >= 0) producer.observers.splice(idx, 1);
      };
    });

    const sub = source$.subscribe({
      next: (v) => {
        setHotObservers((prev) => prev.map((r) => (r.id === id ? { ...r, values: [...r.values, v] } : r)));
      },
    });
    hotSubsRef.current.push(sub);
  }, [hotRunning, hotProducerValue, ensureHotProducer]);

  // ---- 独立重置 ----
  const resetCold = useCallback(() => {
    coldSubsRef.current.forEach((s) => s.unsubscribe());
    coldSubsRef.current = [];
    setColdRunning(false);
    setColdObservers([]);
  }, []);

  const resetHot = useCallback(() => {
    hotSubsRef.current.forEach((s) => s.unsubscribe());
    hotSubsRef.current = [];
    if (hotProducerRef.current) {
      if (hotProducerRef.current.handle) clearInterval(hotProducerRef.current.handle);
      hotProducerRef.current = null;
    }
    setHotRunning(false);
    setHotObservers([]);
    setHotProducerValue(0);
  }, []);

  const resetAll = useCallback(() => {
    resetCold();
    resetHot();
  }, [resetCold, resetHot]);

  useUnmount(() => {
    coldSubsRef.current.forEach((s) => s.unsubscribe());
    hotSubsRef.current.forEach((s) => s.unsubscribe());
    if (hotProducerRef.current?.handle) clearInterval(hotProducerRef.current.handle);
  });

  return (
    <section className={styles.demo}>
      {/* ---- Cold ---- */}
      <div className={clsx(styles.panel, styles.coldPanel)}>
        <h3 className={styles.panelTitle}>❄️ Cold Observable</h3>
        <p className={styles.panelDesc}>每次订阅创建一个新的{'"生产者"'}，从 1 开始</p>

        <div className={styles.producerBar}>
          <span className={styles.producerLabel}>生产者</span>
          <span className={clsx(styles.producerValue, coldRunning && styles.producerValueActive)}>{coldRunning ? "每个 Observer 独立生产" : "未启动"}</span>
        </div>

        <div className={styles.observerList}>
          {coldObservers.length === 0 && <p className={styles.observerEmpty}>暂无观察者</p>}
          {coldObservers.map((obs) => (
            <div key={obs.id} className={clsx(styles.observerCard, obs.completed && styles.observerCardCompleted)}>
              <span className={styles.observerId}>
                Observer #{obs.id}
                {obs.completed && <span className={styles.completedTag}>已完成</span>}
              </span>
              <div className={styles.observerTrack}>
                {obs.values.map((v, i) => (
                  <span key={i} className={clsx(styles.trackDot, styles.trackDotCold, i === obs.values.length - 1 && styles.trackDotLatest)}>
                    {v}
                  </span>
                ))}
                {!obs.completed && obs.values.length < EMIT_LIMIT && <span className={styles.trackPending}>...</span>}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.actionRow}>
          <button className={styles.addBtn} onClick={addColdObserver}>
            + 添加观察者
          </button>
          <button className={styles.resetPanelBtn} onClick={resetCold} disabled={!coldRunning && coldObservers.length === 0}>
            重置
          </button>
        </div>
      </div>

      {/* ---- Hot ---- */}
      <div className={clsx(styles.panel, styles.hotPanel)}>
        <h3 className={styles.panelTitle}>🔥 Hot Observable</h3>
        <p className={styles.panelDesc}>共享一个{'"生产者"'}，后来者只能看到当前及之后的数据</p>

        <div className={styles.producerBar}>
          <span className={styles.producerLabel}>共享生产者</span>
          <span className={clsx(styles.producerValue, hotRunning && styles.producerValueActive)}>{hotRunning ? `当前值: ${hotProducerValue}` : "未启动"}</span>
        </div>

        <div className={styles.observerList}>
          {hotObservers.length === 0 && <p className={styles.observerEmpty}>暂无观察者</p>}
          {hotObservers.map((obs) => (
            <div key={obs.id} className={styles.observerCard}>
              <span className={styles.observerId}>
                Observer #{obs.id}
                {obs.joinedAt > 0 && <span className={styles.joinedTag}>加入于值 {obs.joinedAt} 之后</span>}
              </span>
              <div className={styles.observerTrack}>
                {obs.values.length === 0 ? (
                  <span className={styles.trackPending}>等待数据...</span>
                ) : (
                  obs.values.map((v, i) => (
                    <span key={i} className={clsx(styles.trackDot, styles.trackDotHot, i === obs.values.length - 1 && styles.trackDotLatest)}>
                      {v}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.actionRow}>
          <button className={styles.addBtn} onClick={addHotObserver}>
            + 添加观察者
          </button>
          <button className={styles.resetPanelBtn} onClick={resetHot} disabled={!hotRunning && hotObservers.length === 0}>
            重置
          </button>
        </div>
      </div>

      <div className={styles.resetBar}>
        <button className={styles.resetBtn} onClick={resetAll}>
          全部重置
        </button>
      </div>
    </section>
  );
}
