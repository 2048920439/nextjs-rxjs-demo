import { BehaviorSubject, interval, share, skipUntil, type Subscription, take, tap, timer } from "rxjs";

export type SkipUntilValue = {
  value: number;
  skipped: boolean;
  at: string;
};

export type SkipUntilOutput = {
  value: number;
  at: string;
};

export type SkipUntilDemoState = {
  running: boolean;
  status: string;
  sourceValues: SkipUntilValue[];
  outputs: SkipUntilOutput[];
  notifierAt: string | null;
};

const INITIAL_STATE: SkipUntilDemoState = {
  running: false,
  status: "点击运行，观察 skipUntil 如何等 notifier$ 触发后才放行",
  sourceValues: [],
  outputs: [],
  notifierAt: null,
};

export class SkipUntilDemoModel {
  private readonly stateSubject = new BehaviorSubject<SkipUntilDemoState>(INITIAL_STATE);
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
      status: "source$ 每 450ms 发值，notifier$ 会在 1500ms 打开通道",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let opened = false;

    const notifier$ = timer(1500).pipe(
      tap(() => {
        opened = true;
        this.patchState({
          notifierAt: stamp(),
          status: "notifier$ 发出信号，skipUntil 开始转发后续 source$ 值",
        });
      }),
      share(),
    );

    const source$ = interval(450).pipe(
      take(7),
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, skipped: !opened, at: stamp() }],
          status: opened ? `${value} 出现在 notifier$ 之后，会被转发` : `${value} 出现在 notifier$ 之前，被 skipUntil 跳过`,
        });
      }),
      skipUntil(notifier$),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `skipUntil 转发 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "skipUntil 完成：notifier$ 触发前的值已跳过，之后的值已转发",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "notifier$ 或 source$ 抛错，skipUntil 演示终止",
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

  private patchState(patch: Partial<SkipUntilDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
