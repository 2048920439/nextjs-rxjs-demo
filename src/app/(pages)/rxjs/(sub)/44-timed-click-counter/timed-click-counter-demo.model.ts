import { BehaviorSubject, mapTo, merge, scan, share, Subject, type Subscription, takeUntil, timer } from "rxjs";

export type TimedClickEvent = {
  count: number;
  at: string;
};

export type TimedClickCounterState = {
  running: boolean;
  ended: boolean;
  status: string;
  count: number;
  events: TimedClickEvent[];
  remainingMs: number;
};

const DURATION_MS = 5000;
const TICK_MS = 250;

const INITIAL_STATE: TimedClickCounterState = {
  running: false,
  ended: false,
  status: "点击开始后，只统计 5 秒内的点击次数",
  count: 0,
  events: [],
  remainingMs: DURATION_MS,
};

export class TimedClickCounterDemoModel {
  private readonly stateSubject = new BehaviorSubject<TimedClickCounterState>(INITIAL_STATE);
  private readonly clickSubject = new Subject<void>();
  private subscription: Subscription | null = null;
  private countdownSubscription: Subscription | null = null;
  private startAt = 0;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  start() {
    this.disposeRun();
    this.startAt = Date.now();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      status: "计时开始：点击按钮会进入 event$.pipe(takeUntil(countDown$))",
    });

    const countDown$ = timer(DURATION_MS).pipe(share());
    const clickCount$ = this.clickSubject.pipe(
      takeUntil(countDown$),
      mapTo(1),
      scan((count, value) => count + value, 0),
    );

    this.subscription = merge(clickCount$, countDown$.pipe(mapTo("end" as const))).subscribe({
      next: (value) => {
        if (value === "end") {
          this.patchState({
            running: false,
            ended: true,
            remainingMs: 0,
            status: "时间结束：countDown$ 触发，takeUntil 完成点击流",
          });
          this.disposeRun();
          return;
        }

        this.patchState({
          count: value,
          events: [...this.state.events, { count: value, at: this.stamp() }],
          status: `第 ${value} 次点击已被统计`,
        });
      },
      complete: () => {
        this.disposeRun();
      },
      error: () => {
        this.patchState({
          running: false,
          ended: true,
          status: "发生错误，计时点击演示终止",
        });
        this.disposeRun();
      },
    });

    this.countdownSubscription = timer(0, TICK_MS)
      .pipe(takeUntil(countDown$))
      .subscribe(() => {
        const remainingMs = Math.max(0, DURATION_MS - (Date.now() - this.startAt));
        this.patchState({ remainingMs });
      });
  }

  click() {
    if (!this.state.running) return;
    this.clickSubject.next();
  }

  reset() {
    this.disposeRun();
    this.stateSubject.next(INITIAL_STATE);
  }

  dispose() {
    this.disposeRun();
  }

  private stamp() {
    return `${Date.now() - this.startAt}ms`;
  }

  private disposeRun() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.countdownSubscription?.unsubscribe();
    this.countdownSubscription = null;
  }

  private patchState(patch: Partial<TimedClickCounterState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
