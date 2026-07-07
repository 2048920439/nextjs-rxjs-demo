import { BehaviorSubject, concat, delay, filter, map, of, type Subscription, tap } from "rxjs";

import type { DebugLogger, DebugLogLevel } from "@/shared/rxjs";
import { createDebugOperator, isRxjsDebugEnabled } from "@/shared/rxjs";

export type DebugSourceValue = {
  value: number;
  at: string;
};

export type DebugOutput = {
  value: number;
  at: string;
};

export type DebugLog = {
  level: DebugLogLevel;
  message: string;
  at: string;
};

export type DebugTimelineEvent = {
  kind: "source" | "result";
  label: string;
  value: number;
  at: string;
};

export type DebugOperatorDemoState = {
  running: boolean;
  debugEnabled: boolean;
  status: string;
  sourceValues: DebugSourceValue[];
  debugLogs: DebugLog[];
  outputs: DebugOutput[];
  timeline: DebugTimelineEvent[];
};

const INITIAL_STATE: DebugOperatorDemoState = {
  running: false,
  debugEnabled: isRxjsDebugEnabled,
  status: isRxjsDebugEnabled
    ? "当前环境已启用 RxJS debug 输出。运行示例后，debug 操作符会记录流经管道的值。"
    : "当前环境关闭了 RxJS debug 输出。debug 操作符会直接返回原 Observable，不产生日志。",
  sourceValues: [],
  debugLogs: [],
  outputs: [],
  timeline: [],
};

const VALUES = [1, 2, 3, 4];

export class DebugOperatorDemoModel {
  private readonly stateSubject = new BehaviorSubject<DebugOperatorDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();

    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      status: "source$ 每 1000ms 发出一个值；debug 只观察管道，不改变 filter/map 的结果。",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    const logger = this.createLogger(stamp);
    const debugLog = createDebugOperator("debug-demo", { level: "debug", logger });

    const source$ = concat(...VALUES.map((value) => of(value).pipe(delay(1000)))).pipe(
      tap((value) => {
        const at = stamp();

        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at }],
          status: `source$ 发出 ${value}`,
          timeline: [...this.state.timeline, { kind: "source", label: "source$", value, at }],
        });
      }),
    );

    const result$ = source$.pipe(
      filter((value) => value % 2 === 0),
      debugLog("after filter"),
      map((value) => value * value),
      debugLog("after map", "info"),
    );

    this.subscription = result$.subscribe({
      next: (value) => {
        const at = stamp();

        this.patchState({
          outputs: [...this.state.outputs, { value, at }],
          status: `result$ 输出 ${value}`,
          timeline: [...this.state.timeline, { kind: "result", label: "result$", value, at }],
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: this.state.debugEnabled
            ? "示例完成：debug 捕获了 filter 后和 map 后的中间状态。"
            : "示例完成：debug 关闭时没有日志，但 result$ 的计算结果不变。",
        });
      },
    });
  }

  reset() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.stateSubject.next(INITIAL_STATE);
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private createLogger(stamp: () => string): Partial<DebugLogger> {
    return {
      debug: (...args) => this.addDebugLog("debug", args, stamp()),
      error: (...args) => this.addDebugLog("error", args, stamp()),
      info: (...args) => this.addDebugLog("info", args, stamp()),
      warn: (...args) => this.addDebugLog("warn", args, stamp()),
    };
  }

  private addDebugLog(level: DebugLogLevel, args: unknown[], at: string) {
    this.patchState({
      debugLogs: [
        ...this.state.debugLogs,
        {
          level,
          message: args.map(formatLogArg).join(" "),
          at,
        },
      ],
    });
  }

  private patchState(patch: Partial<DebugOperatorDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}

function formatLogArg(arg: unknown) {
  if (typeof arg === "string") return arg;
  if (arg instanceof Error) return arg.message;

  return JSON.stringify(arg);
}
