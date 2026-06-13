"use client";

import { useUnmount } from "ahooks";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { interval, map, Subject, Subscription, take } from "rxjs";

import styles from "./styles.module.scss";

interface ObserverRecord {
  id: number;
  values: number[];
  joinedAt: number;
  completed?: boolean;
}

const EMIT_LIMIT = 10;
const EMIT_INTERVAL = 1000;

/**
 * 2.4 Hot Observable 和 Cold Observable 交互演示
 *
 * Cold：每次订阅都重新执行上游，得到完整序列。
 * Hot：多个订阅者共享同一个上游，晚来的只能收到后续值。
 */
export default function HotColdDemo() {
  const [coldRunning, setColdRunning] = useState(false);
  const [hotRunning, setHotRunning] = useState(false);
  const [coldObservers, setColdObservers] = useState<ObserverRecord[]>([]);
  const [hotObservers, setHotObservers] = useState<ObserverRecord[]>([]);
  const [hotProducerValue, setHotProducerValue] = useState(0);

  const coldSubsRef = useRef<Subscription[]>([]);
  const hotSubsRef = useRef<Subscription[]>([]);
  const hotProducerSubRef = useRef<Subscription | null>(null);
  const hotSubjectRef = useRef<Subject<number> | null>(null);
  const observerIdRef = useRef(0);

  const markColdComplete = useCallback((id: number) => {
    setColdObservers((prev) => {
      const next = prev.map((r) => (r.id === id ? { ...r, completed: true } : r));
      if (next.every((r) => r.completed)) setColdRunning(false);
      return next;
    });
  }, []);

  const markHotComplete = useCallback((id: number) => {
    setHotObservers((prev) => prev.map((r) => (r.id === id ? { ...r, completed: true } : r)));
  }, []);

  const addColdObserver = useCallback(() => {
    if (!coldRunning) setColdRunning(true);

    const id = ++observerIdRef.current;
    setColdObservers((prev) => [...prev, { id, values: [], joinedAt: 0, completed: false }]);

    const source$ = interval(EMIT_INTERVAL).pipe(
      take(EMIT_LIMIT),
      map((index) => index + 1),
    );

    const sub = source$.subscribe({
      next: (value) => {
        setColdObservers((prev) => prev.map((r) => (r.id === id ? { ...r, values: [...r.values, value] } : r)));
      },
      complete: () => {
        markColdComplete(id);
      },
    });

    coldSubsRef.current.push(sub);
  }, [coldRunning, markColdComplete]);

  const ensureHotProducer = useCallback(() => {
    if (hotProducerSubRef.current) return;

    const subject = new Subject<number>();
    hotSubjectRef.current = subject;
    setHotRunning(true);
    setHotProducerValue(0);

    hotProducerSubRef.current = interval(EMIT_INTERVAL)
      .pipe(
        take(EMIT_LIMIT),
        map((index) => index + 1),
      )
      .subscribe({
        next: (value) => {
          setHotProducerValue(value);
          subject.next(value);
        },
        complete: () => {
          subject.complete();
          hotProducerSubRef.current = null;
          hotSubjectRef.current = null;
          setHotRunning(false);
        },
      });
  }, []);

  const addHotObserver = useCallback(() => {
    ensureHotProducer();

    const id = ++observerIdRef.current;
    const joinedAt = hotProducerValue;
    setHotObservers((prev) => [...prev, { id, values: [], joinedAt, completed: false }]);

    const sub = hotSubjectRef.current!.subscribe({
      next: (value) => {
        setHotObservers((prev) => prev.map((r) => (r.id === id ? { ...r, values: [...r.values, value] } : r)));
      },
      complete: () => {
        markHotComplete(id);
      },
    });

    hotSubsRef.current.push(sub);
  }, [ensureHotProducer, hotProducerValue, markHotComplete]);

  const resetCold = useCallback(() => {
    coldSubsRef.current.forEach((s) => s.unsubscribe());
    coldSubsRef.current = [];
    setColdRunning(false);
    setColdObservers([]);
  }, []);

  const resetHot = useCallback(() => {
    hotSubsRef.current.forEach((s) => s.unsubscribe());
    hotSubsRef.current = [];
    hotProducerSubRef.current?.unsubscribe();
    hotProducerSubRef.current = null;
    hotSubjectRef.current = null;
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
    hotProducerSubRef.current?.unsubscribe();
  });

  return (
    <section className={styles.demo}>
      <div className={clsx(styles.panel, styles.coldPanel)}>
        <h3 className={styles.panelTitle}>❄️ Cold Observable</h3>
        <p className={styles.panelDesc}>每次订阅都重新创建一条独立的数据流，从 1 开始。</p>

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

      <div className={clsx(styles.panel, styles.hotPanel)}>
        <h3 className={styles.panelTitle}>🔥 Hot Observable</h3>
        <p className={styles.panelDesc}>多个观察者共享同一个上游，晚来的只会看到后续数据。</p>

        <div className={styles.producerBar}>
          <span className={styles.producerLabel}>共享生产者</span>
          <span className={clsx(styles.producerValue, hotRunning && styles.producerValueActive)}>{hotRunning ? `当前值 ${hotProducerValue}` : "未启动"}</span>
        </div>

        <div className={styles.observerList}>
          {hotObservers.length === 0 && <p className={styles.observerEmpty}>暂无观察者</p>}
          {hotObservers.map((obs) => (
            <div key={obs.id} className={styles.observerCard}>
              <span className={styles.observerId}>
                Observer #{obs.id}
                {obs.joinedAt > 0 && <span className={styles.joinedTag}>加入于 {obs.joinedAt}</span>}
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
