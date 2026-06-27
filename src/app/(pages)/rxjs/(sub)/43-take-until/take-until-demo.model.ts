import { BehaviorSubject, interval, type Subscription, takeUntil, tap, timer } from "rxjs";

export type TakeUntilValue = {
  value: number;
  at: string;
};

export type TakeUntilDemoState = {
  running: boolean;
  status: string;
  sourceValues: TakeUntilValue[];
  outputs: TakeUntilValue[];
  notifierAt: string | null;
};

const INITIAL_STATE: TakeUntilDemoState = {
  running: false,
  status: "点击运行，观察 notifier$ 如何关闭 takeUntil 的下游通道",
  sourceValues: [],
  outputs: [],
  notifierAt: null,
};

export class TakeUntilDemoModel {
  private readonly stateSubject = new BehaviorSubject<TakeUntilDemoState>(INITIAL_STATE);
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
      status: "source$ 每 700ms 发值，notifier$ 会在 1800ms 发出关闭信号",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const notifier$ = timer(1800).pipe(
      tap(() => {
        this.patchState({
          notifierAt: stamp(),
          status: "notifier$ 发出信号，takeUntil 立即 complete",
        });
      }),
    );

    const source$ = interval(700).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，notifier$ 未触发前会被转发`,
        });
      }),
      takeUntil(notifier$),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `takeUntil 转发 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "takeUntil 完成：notifier$ 发出信号后关闭通道",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "notifier$ 或 source$ 抛错，takeUntil 演示终止",
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

  private patchState(patch: Partial<TakeUntilDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
