"use client";

import { useRef, useState } from "react";
import { defer, Observable, of, Subscription } from "rxjs";

import styles from "./styles.module.scss";

type Stage = "idle" | "created" | "subscribed";

/**
 * 4.3.8 defer 交互演示
 *
 * 保持原来的 UI 结构，只用一条主流程：
 * 第一次点击创建 deferred$，第二次点击订阅并执行，第三次点击重置。
 */
export default function DeferDemo() {
  const deferredRef = useRef<Observable<string> | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);

  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [factoryCount, setFactoryCount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [stage, setStage] = useState<Stage>("idle");

  const createDeferred = () => {
    const createTime = new Date().toLocaleTimeString();
    setCreatedAt(createTime);
    setFactoryCount(0);
    setLogs([]);
    setStage("created");

    deferredRef.current = defer(() => {
      setFactoryCount((count) => count + 1);
      return of(new Date().toLocaleTimeString());
    });
  };

  const subscribeDeferred = () => {
    if (!deferredRef.current) return;

    subscriptionRef.current?.unsubscribe();
    setLogs([]);

    subscriptionRef.current = deferredRef.current.subscribe({
      next: (value) => setLogs((prev) => [...prev, `next: ${value}`]),
      complete: () => {
        setLogs((prev) => [...prev, "complete"]);
        setStage("subscribed");
      },
      error: (error) => {
        setLogs((prev) => [...prev, `error: ${String(error)}`]);
        setStage("subscribed");
      },
    });
  };

  const resetAll = () => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    deferredRef.current = null;
    setCreatedAt(null);
    setFactoryCount(0);
    setLogs([]);
    setStage("idle");
  };

  const handlePrimaryClick = () => {
    if (stage === "idle") {
      createDeferred();
      return;
    }

    if (stage === "created") {
      subscribeDeferred();
      return;
    }

    resetAll();
  };

  const primaryLabel = stage === "idle" ? "1. 创建 deferred$" : stage === "created" ? "2. 订阅并执行" : "3. 重置";
  const statusText = stage === "idle" ? "未创建" : stage === "created" ? "已创建 deferred$" : "已订阅执行";

  return (
    <section className={styles.demo}>
      <div className={styles.statusBox}>
        <span className={styles.statusLabel}>创建时的时间</span>
        <span className={styles.statusValue}>{createdAt ?? "—"}</span>
      </div>

      <div className={styles.statusBox}>
        <span className={styles.statusLabel}>factory 调用次数</span>
        <span className={styles.statusValue}>{factoryCount}</span>
      </div>

      <div className={styles.controls} style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        <button className={styles.createSubBtn} type="button" onClick={handlePrimaryClick}>
          {primaryLabel}
        </button>
      </div>

      <div className={styles.output}>
        <div className={styles.outEmpty}>
          <code>defer(() =&gt; of(订阅时的时间))</code>
          <br />
          <code>第一次点击只创建，第二次点击才执行 factory</code>
        </div>

        <div className={styles.outNext}>{logs.length === 0 ? "等待操作..." : logs.map((line, i) => <div key={i}>{line}</div>)}</div>

        <div className={styles.outComplete}>{statusText}</div>
      </div>

      <p className={styles.info}>
        <code>defer</code> 的重点是把 factory 的执行延迟到订阅时刻。
        <br />
        React 只负责按钮点击，真正的“何时生成值”由 RxJS 决定。
      </p>
    </section>
  );
}
