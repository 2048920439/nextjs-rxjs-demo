"use client";

import { useCallback, useState } from "react";
import { fromPromise } from "rxjs/internal/observable/innerFrom";

import { getDelay } from "@/api-client";

import styles from "./styles.module.scss";

interface DelayResponse {
  success: boolean;
  delay: number;
}

/**
 * 4.3.6 ajax 交互演示
 *
 * 通过 ajax 操作符调用项目内部 /api/mock/delay 接口，
 * 传入延迟参数，演示 AJAX 请求的 loading → 成功/失败状态。
 */
export default function AjaxDemo() {
  const [delayMs, setDelayMs] = useState(1500);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DelayResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setResult(null);

    // ajax.getJSON<DelayResponse>(`/api/mock/delay?ms=${delayMs}`).subscribe({
    // 这里主要是为了规避在api-client以外定义接口所以使用了fromPromise，实际在当前示例中应该使用 ajax.getJSON，二者功能相同
    fromPromise(getDelay(delayMs)).subscribe({
      next: (data) => {
        setResult(data);
        setLoading(false);
      },
      error: (err) => {
        setError(err.message || "请求失败");
        setLoading(false);
      },
    });
  }, [delayMs]);

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
        {loading ? "请求中…" : `ajax.getJSON → /api/mock/delay?ms=${delayMs}`}
      </button>

      <div className={styles.result}>
        {result && (
          <>
            <span className={styles.starCount}>{result.delay}ms</span>
            <span className={styles.starLabel}>
              服务端延迟 {result.delay}ms 后返回 — {result.success ? "成功" : "失败"}
            </span>
          </>
        )}
        {loading && <span className={styles.status}>正在请求 /api/mock/delay…</span>}
        {error && <span className={styles.errorMsg}>{error}</span>}
      </div>
    </section>
  );
}
