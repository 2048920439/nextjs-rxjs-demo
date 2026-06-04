"use client";

import { useUnmount } from "ahooks";
import clsx from "clsx";
import { useCallback, useRef, useState } from "react";
import { EMPTY, NEVER, Subscription, throwError } from "rxjs";

import styles from "./styles.module.scss";

type ResultType = "idle" | "waiting" | "complete" | "error";

interface CardState {
  result: ResultType;
  message: string;
}

/**
 * 4.2.6 empty、never、throw 交互演示
 *
 * 三个卡片分别展示 empty() 立即完结、never() 永不动作、throwError() 立即出错。
 */
export default function MinimalDemo() {
  const [emptyState, setEmptyState] = useState<CardState>({ result: "idle", message: "等待订阅" });
  const [neverState, setNeverState] = useState<CardState>({ result: "idle", message: "等待订阅" });
  const [throwState, setThrowState] = useState<CardState>({ result: "idle", message: "等待订阅" });

  const emptySubRef = useRef<Subscription | null>(null);
  const neverSubRef = useRef<Subscription | null>(null);
  const throwSubRef = useRef<Subscription | null>(null);

  const subscribeEmpty = useCallback(() => {
    setEmptyState({ result: "waiting", message: "订阅中…" });
    emptySubRef.current = EMPTY.subscribe({
      complete: () => setEmptyState({ result: "complete", message: "complete — 直接完结，无数据" }),
    });
  }, []);

  const subscribeNever = useCallback(() => {
    setNeverState({ result: "waiting", message: "等待中…（永不完结）" });
    neverSubRef.current = NEVER.subscribe({
      next: () => {}, // 永远不会调用
      complete: () => {}, // 永远不会调用
    });
  }, []);

  const cancelNever = useCallback(() => {
    neverSubRef.current?.unsubscribe();
    neverSubRef.current = null;
    setNeverState({ result: "idle", message: "已取消订阅" });
  }, []);

  const subscribeThrow = useCallback(() => {
    setThrowState({ result: "waiting", message: "订阅中…" });
    throwSubRef.current = throwError(() => new Error("Oops!")).subscribe({
      error: (err) => setThrowState({ result: "error", message: `catch: ${err.message}` }),
    });
  }, []);

  useUnmount(() => {
    emptySubRef.current?.unsubscribe();
    neverSubRef.current?.unsubscribe();
    throwSubRef.current?.unsubscribe();
  });

  return (
    <section className={styles.demo}>
      {/* empty */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>EMPTY</h3>
        <p className={styles.cardDesc}>
          不产数据，
          <br />
          直接调用 complete
        </p>
        <button className={styles.emptyBtn} onClick={subscribeEmpty}>
          订阅 empty()
        </button>
        <div
          className={clsx(styles.result, emptyState.result === "complete" && styles.resultComplete, emptyState.result === "waiting" && styles.resultWaiting)}
        >
          {emptyState.message}
        </div>
      </div>

      {/* never */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>NEVER</h3>
        <p className={styles.cardDesc}>
          不产数据、不结束、
          <br />
          不出错，永远待着
        </p>
        {neverState.result === "waiting" ? (
          <button className={styles.neverBtn} onClick={cancelNever}>
            取消订阅
          </button>
        ) : (
          <button className={styles.neverBtn} onClick={subscribeNever}>
            订阅 never()
          </button>
        )}
        <div className={clsx(styles.result, neverState.result === "waiting" && styles.resultWaiting)}>{neverState.message}</div>
      </div>

      {/* throwError */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>throwError</h3>
        <p className={styles.cardDesc}>
          不产数据，
          <br />
          直接调用 error
        </p>
        <button className={styles.throwBtn} onClick={subscribeThrow}>
          订阅 throwError()
        </button>
        <div className={clsx(styles.result, throwState.result === "error" && styles.resultError, throwState.result === "waiting" && styles.resultWaiting)}>
          {throwState.message}
        </div>
      </div>
    </section>
  );
}
