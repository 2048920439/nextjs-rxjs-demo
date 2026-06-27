import { BehaviorSubject, interval, map, sample, Subject, type Subscription, takeUntil, tap, timer } from "rxjs";

export type SampleTick = {
  value: number;
  at: string;
};

export type SampleOutput = {
  value: number;
  at: string;
};

export type SampleDemoState = {
  running: boolean;
  status: string;
  latestTick: SampleTick | null;
  sampleClicks: string[];
  outputs: SampleOutput[];
};

const INITIAL_STATE: SampleDemoState = {
  running: false,
  status: "点击开始后，用 Sample 按钮从计时流中取当前最新值",
  latestTick: null,
  sampleClicks: [],
  outputs: [],
};

const RUN_MS = 6000;

export class SampleDemoModel {
  private readonly stateSubject = new BehaviorSubject<SampleDemoState>(INITIAL_STATE);
  private readonly sampleSubject = new Subject<void>();
  private subscription: Subscription | null = null;
  private startAt = 0;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  start() {
    this.subscription?.unsubscribe();
    this.startAt = Date.now();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      status: "tick$ 每 100ms 更新；点击 Sample 会让 notifier$ 发值",
    });

    const stop$ = timer(RUN_MS);
    const tick$ = interval(100).pipe(
      map((value) => value * 100),
      tap((value) => {
        this.patchState({
          latestTick: { value, at: this.stamp() },
          status: `tick$ 最新值为 ${value}ms`,
        });
      }),
      takeUntil(stop$),
    );

    const sample$ = tick$.pipe(sample(this.sampleSubject));

    this.subscription = sample$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: this.stamp() }],
          status: `sample 收到 notifier$，输出当前最新值 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "sample 演示结束：tick$ complete 后不会再采样",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，sample 演示终止",
        });
      },
    });
  }

  sampleNow() {
    if (!this.state.running) return;
    this.patchState({
      sampleClicks: [...this.state.sampleClicks, this.stamp()],
      status: "notifier$ 发出采样信号",
    });
    this.sampleSubject.next();
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

  private stamp() {
    return `${Date.now() - this.startAt}ms`;
  }

  private patchState(patch: Partial<SampleDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
