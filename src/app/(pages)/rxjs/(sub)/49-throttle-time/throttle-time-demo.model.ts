import { BehaviorSubject, interval, share, type Subscription, take, tap, throttleTime } from "rxjs";

export type ThrottleTimeValue = {
  value: number;
  passed: boolean;
  at: string;
};

export type ThrottleTimeOutput = {
  value: number;
  at: string;
};

export type ThrottleTimeDemoState = {
  running: boolean;
  status: string;
  sourceValues: ThrottleTimeValue[];
  outputs: ThrottleTimeOutput[];
};

const INITIAL_STATE: ThrottleTimeDemoState = {
  running: false,
  status: "点击运行，观察 throttleTime 如何只放行每个时间窗口的第一个值",
  sourceValues: [],
  outputs: [],
};

const SOURCE_INTERVAL_MS = 450;
const WINDOW_MS = 900;

export class ThrottleTimeDemoModel {
  private readonly stateSubject = new BehaviorSubject<ThrottleTimeDemoState>(INITIAL_STATE);
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
      status: `source$ 每 ${SOURCE_INTERVAL_MS}ms 发值，throttleTime(${WINDOW_MS}) 会先放行再关闭窗口`,
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let windowClosedUntil = 0;

    const source$ = interval(SOURCE_INTERVAL_MS).pipe(
      take(8),
      tap((value) => {
        const now = Date.now() - startAt;
        const passed = now >= windowClosedUntil;
        if (passed) windowClosedUntil = now + WINDOW_MS;

        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, passed, at: stamp() }],
          status: passed ? `${value} 是当前窗口的第一个值，会立刻进入下游` : `${value} 落在关闭窗口内，被 throttleTime 丢弃`,
        });
      }),
      throttleTime(WINDOW_MS),
      share(),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `result$ 收到 ${value}，新的 ${WINDOW_MS}ms 窗口开始`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "throttleTime 完成：每个窗口只保留第一个上游值",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，throttleTime 演示终止",
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

  private patchState(patch: Partial<ThrottleTimeDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
