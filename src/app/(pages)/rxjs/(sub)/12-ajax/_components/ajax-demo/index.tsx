"use client";

import { useUnmount } from "ahooks";
import { useCallback, useRef, useState } from "react";
import { Subscription } from "rxjs";
import { ajax } from "rxjs/ajax";

import styles from "./styles.module.scss";

interface DelayResponse {
  success: boolean;
  delay: number;
}

/**
 * 4.3.6 ajax 交互演示
 *
 * 直接使用 rxjs/ajax 的 getJSON 方法，请求项目内的 mock 接口。
 * 这样读者能看到 ajax 的真实作用：把 HTTP 请求变成 Observable。
 */
export default function AjaxDemo() {
  const [delayMs, setDelayMs] = useState(1500);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DelayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const subscriptionRef = useRef<Subscription | null>(null);

  const handleFetch = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    setLoading(true);
    setError(null);
    setResult(null);

    subscriptionRef.current = ajax.getJSON<DelayResponse>(`/api/mock/delay?ms=${delayMs}`).subscribe({
      next: (data) => {
        setResult(data);
      },
      error: (err) => {
        setError(err?.message || "请求失败");
        setLoading(false);
        subscriptionRef.current = null;
      },
      complete: () => {
        setLoading(false);
        subscriptionRef.current = null;
      },
    });
  }, [delayMs]);

  useUnmount(() => {
    subscriptionRef.current?.unsubscribe();
  });

  return (
    <section className={styles.demo}>
      <div className={styles.controls}>
        <label className={styles.label}>
          延迟(ms):
          <input
            type="number"
            className={styles.input}
            value={delayMs}
            min={100}
            max={10000}
            step={100}
            onChange={(e) => setDelayMs(Number(e.target.value) || 1500)}
            disabled={loading}
          />
        </label>
      </div>

      <button className={styles.fetchBtn} onClick={handleFetch} disabled={loading}>
        {loading ? "请求中..." : `ajax.getJSON -> /api/mock/delay?ms=${delayMs}`}
      </button>

      <div className={styles.result}>
        {result && (
          <>
            <span className={styles.starCount}>{result.delay}ms</span>
            <span className={styles.starLabel}>
              服务端延迟 {result.delay}ms 后返回，结果为 {result.success ? "成功" : "失败"}
            </span>
          </>
        )}
        {loading && <span className={styles.status}>正在请求 /api/mock/delay...</span>}
        {error && <span className={styles.errorMsg}>{error}</span>}
      </div>
    </section>
  );
}
