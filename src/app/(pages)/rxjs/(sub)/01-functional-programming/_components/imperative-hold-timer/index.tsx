"use client";

import { useEffect, useRef } from "react";

import styles from "./styles.module.scss";

/**
 * 命令式按住计时器 — 对应 jQuery 版本
 *
 * mousedown → 记录 startTime
 * mouseup   → 计算 elapsed、直接更新 DOM
 *
 * 体现了"怎么做（How）"的编程风格。
 */
export default function ImperativeHoldTimer() {
  const btnRef = useRef<HTMLButtonElement>(null);
  const displayRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const btn = btnRef.current!;
    const display = displayRef.current!;
    let startTime: number | null = null;

    const onMouseDown = () => {
      startTime = Date.now();
      display.textContent = "0";
    };

    const onMouseUp = () => {
      if (startTime === null) return;
      const elapsed = Date.now() - startTime;
      startTime = null;
      display.textContent = String(elapsed);
    };

    btn.addEventListener("mousedown", onMouseDown);
    btn.addEventListener("mouseup", onMouseUp);
    btn.addEventListener("mouseleave", onMouseUp);

    return () => {
      btn.removeEventListener("mousedown", onMouseDown);
      btn.removeEventListener("mouseup", onMouseUp);
      btn.removeEventListener("mouseleave", onMouseUp);
    };
  }, []);

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>命令式（Imperative）</h2>
      <button ref={btnRef} className={styles.holdBtn}>
        按住我，松手计时
      </button>
      <p className={styles.time}>
        按住时长：
        <span ref={displayRef} className={styles.value}>
          0
        </span>{" "}
        ms
      </p>
      <p className={styles.note}>
        通过 <code>addEventListener</code> 直接操作 DOM
      </p>
    </section>
  );
}
