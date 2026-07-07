"use client";

import clsx from "clsx";
import { useCallback, useEffect, useState } from "react";

import CodeBlock from "@/app/(components)/code-block";
import { useObservableState } from "@/service-core";

import styles from "../_backpressure/backpressure-page.module.scss";
import { DebugOperatorDemoModel } from "./debug-operator-demo.model";

// sidebar-title: 12.1.4 改进的日志调试方法

const DEBUG_OPERATOR_CODE = `// RxJS 7：用 tap 创建可配置的 debug 操作符
import { tap, type MonoTypeOperatorFunction } from "rxjs";

const isRxjsDebugEnabled = process.env.NEXT_PUBLIC_RXJS_DEBUG === "true";
const defaultLogger = console;

type DebugLogLevel = "debug" | "info" | "warn" | "error";
type DebugLogger = Pick<Console, DebugLogLevel>;

type DebugOperatorOptions = {
  enabled?: boolean;
  level?: DebugLogLevel;
  logger?: Partial<DebugLogger>;
};

type DebugOperator = <T>(label: string, level?: DebugLogLevel) => MonoTypeOperatorFunction<T>;

export function createDebugOperator(instanceName = "", operatorOptions: DebugOperatorOptions = {}): DebugOperator {
  return function debugInInstance<T>(label: string, level?: DebugLogLevel): MonoTypeOperatorFunction<T> {
    const enabled = operatorOptions.enabled ?? isRxjsDebugEnabled;
    const logLevel = level ?? operatorOptions.level ?? "debug";
    const logger = operatorOptions.logger ?? defaultLogger;
    const logLabel = instanceName ? \`\${instanceName}:\${label}\` : label;

    if (!enabled) {
      return (source$) => source$;
    }

    return tap({
      next: (value) => writeLog(logger, logLevel, \`[\${logLabel}] next\`, value),
      error: (error) => writeLog(logger, "error", \`[\${logLabel}] error\`, error),
      complete: () => writeLog(logger, logLevel, \`[\${logLabel}] complete\`),
    });
  };
}

function writeLog(logger: Partial<DebugLogger>, level: DebugLogLevel, ...args: unknown[]) {
  const method = logger[level];
  method ? method.call(logger, ...args) : defaultLogger[level](...args);
}

export const debug = createDebugOperator();`;

const USAGE_CODE = `import { filter, map, of } from "rxjs";
import { createDebugOperator } from "@/shared/rxjs";

// 配置优先级：环境变量 < 自定义 debug op 实例配置 < 单点调用配置
const debugLog = createDebugOperator("debug-demo", {
  level: "debug",
  logger: console,
  // enabled 只能在自定义 debug op 实例配置里覆盖环境变量
  // enabled: false,
});

of(1, 2, 3, 4).pipe(
  filter((value) => value % 2 === 0),
  debugLog("after filter"),
  map((value) => value * value),
  debugLog("after map", "info"),
  // debugLog("wrong", { enabled: false }) // 类型错误：第二个参数只能是 DebugLogLevel
).subscribe(console.log);

// NEXT_PUBLIC_RXJS_DEBUG=true:
// [debug-demo:after filter] next 2
// [debug-demo:after map] next 4
// 4
// [debug-demo:after filter] next 4
// [debug-demo:after map] next 16
// 16
//
// NEXT_PUBLIC_RXJS_DEBUG=false 且 debug op 实例没有覆盖 enabled:
// 4
// 16`;

const NEXT_CONFIG_CODE = `// next.config.ts
import type { NextConfig } from "next";

const rxjsDebugEnabled = process.env.NODE_ENV === "production" ? "false" : "true";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_RXJS_DEBUG: rxjsDebugEnabled,
  },
};

export default nextConfig;`;

export default function DebugOperatorPage() {
  const [demo] = useState(() => new DebugOperatorDemoModel());
  const state = useObservableState(demo.state$, () => demo.state);

  useEffect(() => () => demo.dispose(), [demo]);

  const run = useCallback(() => demo.run(), [demo]);
  const reset = useCallback(() => demo.reset(), [demo]);

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.heading}>12.1.4 改进的日志调试方法</h1>
        <p className={styles.subtitle}>
          原书用 do 封装 debug 操作符；RxJS 7 里对应使用 tap。这个 debug 操作符只观察 next/error/complete，不改变数据流，并由 Next.js 环境变量控制是否输出。
        </p>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>交互演示</h2>
        <section className={styles.demo}>
          <div className={styles.header}>
            <p className={styles.summary}>{state.status}</p>
            <div className={styles.actions}>
              <button className={styles.primaryBtn} onClick={run} disabled={state.running}>
                运行
              </button>
              <button className={styles.secondaryBtn} onClick={reset} disabled={state.running && state.sourceValues.length === 0}>
                重置
              </button>
            </div>
          </div>

          <div className={styles.rule}>
            <span>NEXT_PUBLIC_RXJS_DEBUG</span>
            <code>{state.debugEnabled ? "true" : "false"}</code>
          </div>

          <div className={styles.grid}>
            <article className={styles.card}>
              <h3 className={styles.cardTitle}>source$ + result$ 输出</h3>
              <p className={styles.cardMeta}>source$ 发出 1、2、3、4；result$ 只保留偶数并平方。</p>
              <div className={styles.outputList}>
                {state.timeline.length === 0 ? (
                  <span className={styles.empty}>{"// 等待 source$ 和 result$ 输出"}</span>
                ) : (
                  state.timeline.map((item) => (
                    <div
                      key={`${item.kind}-${item.value}-${item.at}`}
                      className={clsx(styles.outputLine, item.kind === "source" ? styles.sourceOutputLine : styles.resultOutputLine)}
                    >
                      <strong>{item.value}</strong>
                      <span>{`${item.label} / ${item.at}`}</span>
                    </div>
                  ))
                )}
              </div>
            </article>

            <article className={styles.resultCard}>
              <h3 className={styles.cardTitle}>debug 日志</h3>
              <p className={styles.cardMeta}>debug 开启时能看到 filter 后和 map 后的中间值；关闭时这里保持为空。</p>
              <div className={styles.outputList}>
                {state.debugLogs.length === 0 ? (
                  <span className={styles.empty}>{"// 当前没有 debug 输出"}</span>
                ) : (
                  state.debugLogs.map((log) => (
                    <div key={`${log.message}-${log.at}`} className={styles.outputLine}>
                      <strong>{log.level}</strong>
                      <span>{`${log.message} / ${log.at}`}</span>
                    </div>
                  ))
                )}
              </div>
            </article>
          </div>
        </section>
      </section>

      <aside className={styles.description}>
        <h3>核心要点</h3>
        <ul>
          <li>
            <strong>tap 替代 do</strong>：RxJS 7 中用 tap 插入日志、副作用和调试观察点。
          </li>
          <li>
            <strong>debug 不改变流</strong>：关闭时返回原 Observable，开启时也只记录通知，不转换数据。
          </li>
          <li>
            <strong>配置优先级</strong>：环境变量决定默认开关，自定义 debug op 实例配置统一控制同一个 debugLog，单点调用只能覆盖 level，不能覆盖 enabled 或
            logger。
          </li>
        </ul>
      </aside>

      <CodeBlock title="debug 操作符" code={DEBUG_OPERATOR_CODE} />
      <CodeBlock title="使用方式" code={USAGE_CODE} />
      <CodeBlock title="Next.js 环境变量" code={NEXT_CONFIG_CODE} />
    </div>
  );
}
