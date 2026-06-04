"use client";

import { useCallback, useState } from "react";
import { defer, of } from "rxjs";

import styles from "./styles.module.scss";

/**
 * 4.3.8 defer 交互演示
 *
 * defer 接受一个工厂函数，在订阅时才调用工厂创建真正的 Observable。
 * 展示"创建"与"订阅"的时机分离。
 */
export default function DeferDemo() {
  const [createdTime, setCreatedTime] = useState<string | null>(null);
  const [subscribedTime, setSubscribedTime] = useState<string | null>(null);
  const [output, setOutput] = useState<{ val: string; complete: boolean }[]>([]);
  const [hasSubscribed, setHasSubscribed] = useState(false);

  const handleCreate = useCallback(() => {
    const now = new Date().toLocaleTimeString();
    setCreatedTime(now);
    setHasSubscribed(false);
    setOutput([]);
    setSubscribedTime(null);
  }, []);

  const handleSubscribe = useCallback(() => {
    if (!createdTime) return;

    setOutput([]);

    const source$ = defer(() => {
      setSubscribedTime(new Date().toLocaleTimeString());
      return of(1, 2, 3);
    });

    source$.subscribe({
      next: (v) => setOutput((prev) => [...prev, { val: String(v), complete: false }]),
      complete: () => setOutput((prev) => [...prev, { val: "", complete: true }]),
    });

    setHasSubscribed(true);
  }, [createdTime]);

  const createTimeStr = createdTime ?? "—";
  const subTimeStr = subscribedTime ?? (hasSubscribed ? "(同步完成)" : "—");

  return (
    <section className={styles.demo}>
      <div className={styles.statusBox}>
        <span className={styles.statusLabel}>defer 创建时间</span>
        <span className={styles.statusValue}>{createTimeStr}</span>
      </div>

      <div className={styles.statusBox}>
        <span className={styles.statusLabel}>实际 Observable 创建（factory 调用）时间</span>
        <span className={styles.statusValue}>{subTimeStr}</span>
      </div>

      {!createdTime ? (
        <button className={styles.createSubBtn} onClick={handleCreate}>
          创建 defer（不触发 factory）
        </button>
      ) : !hasSubscribed ? (
        <button className={styles.createSubBtn} onClick={handleSubscribe}>
          订阅（此时才调用 factory）
        </button>
      ) : (
        <button className={styles.createSubBtn} onClick={handleCreate} disabled={!hasSubscribed}>
          重新创建
        </button>
      )}

      <div className={styles.output}>
        {output.length === 0 ? (
          <span className={styles.outEmpty}>{"// 先创建 defer，再订阅，观察时间差异"}</span>
        ) : (
          <>
            {output.map((item, i) =>
              item.complete ? (
                <div key={i} className={styles.outComplete}>
                  {"// complete"}
                </div>
              ) : (
                <div key={i} className={styles.outNext}>
                  next: {item.val}
                </div>
              ),
            )}
          </>
        )}
      </div>

      <p className={styles.info}>
        <code>const source$ = defer(() =&gt; of(1, 2, 3))</code> — 创建时不调用 factory，
        <br />
        只有 <code>subscribe()</code> 时才创建真正的 Observable。
        <br />
        适用于推迟 AJAX 请求等资源占用场景。
      </p>
    </section>
  );
}
