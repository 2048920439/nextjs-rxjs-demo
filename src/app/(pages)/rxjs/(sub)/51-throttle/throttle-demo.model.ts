import { BehaviorSubject, interval, Subject, type Subscription, takeUntil, tap, throttle, timer } from "rxjs";

export type ThrottleValue = {
  value: number;
  passed: boolean;
  at: string;
};

export type ThrottleOutput = {
  value: number;
  at: string;
};

export type ThrottleDemoState = {
  running: boolean;
  gateClosed: boolean;
  status: string;
  sourceValues: ThrottleValue[];
  releases: string[];
  outputs: ThrottleOutput[];
};

const INITIAL_STATE: ThrottleDemoState = {
  running: false,
  gateClosed: false,
  status: "点击开始后，release$ 控制 throttle 何时重新打开通道",
  sourceValues: [],
  releases: [],
  outputs: [],
};

const RUN_MS = 9000;
const SOURCE_INTERVAL_MS = 650;

export class ThrottleDemoModel {
  private readonly stateSubject = new BehaviorSubject<ThrottleDemoState>(INITIAL_STATE);
  private readonly releaseSubject = new Subject<void>();
  private subscription: Subscription | null = null;
  private startAt = 0;
  private gateClosed = false;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  start() {
    this.subscription?.unsubscribe();
    this.startAt = Date.now();
    this.gateClosed = false;
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      status: "source$ 每 650ms 发值；第一个值通过后，throttle 等 release$ 再打开通道",
    });

    const stop$ = timer(RUN_MS);
    const source$ = interval(SOURCE_INTERVAL_MS).pipe(
      tap((value) => {
        const passed = !this.gateClosed;
        if (passed) this.gateClosed = true;

        this.patchState({
          gateClosed: this.gateClosed,
          sourceValues: [...this.state.sourceValues, { value, passed, at: this.stamp() }],
          status: passed ? `${value} 通过 throttle，通道关闭，等待 release$` : `${value} 到来时通道仍关闭，被 throttle 丢弃`,
        });
      }),
      throttle(() => this.releaseSubject),
      takeUntil(stop$),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: this.stamp() }],
          status: `result$ 收到 ${value}；点击 Release 让下一个 source$ 值有机会通过`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.gateClosed = false;
        this.patchState({
          running: false,
          gateClosed: false,
          status: "throttle 演示结束：release$ 控制了每段节流窗口的结束",
        });
      },
      error: () => {
        this.subscription = null;
        this.gateClosed = false;
        this.patchState({
          running: false,
          gateClosed: false,
          status: "发生错误，throttle 演示终止",
        });
      },
    });
  }

  release() {
    if (!this.state.running || !this.gateClosed) return;

    this.patchState({
      releases: [...this.state.releases, this.stamp()],
      status: "release$ 发出信号，throttle 通道重新打开",
    });
    this.gateClosed = false;
    this.releaseSubject.next();
    this.patchState({ gateClosed: false });
  }

  reset() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.gateClosed = false;
    this.stateSubject.next(INITIAL_STATE);
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private stamp() {
    return `${Date.now() - this.startAt}ms`;
  }

  private patchState(patch: Partial<ThrottleDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
