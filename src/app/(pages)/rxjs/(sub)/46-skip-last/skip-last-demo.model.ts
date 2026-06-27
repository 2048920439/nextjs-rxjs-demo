import { BehaviorSubject, interval, skipLast, type Subscription, take, tap } from "rxjs";

export type SkipLastValue = {
  value: number;
  pending: boolean;
  at: string;
};

export type SkipLastOutput = {
  value: number;
  at: string;
};

export type SkipLastDemoState = {
  running: boolean;
  status: string;
  sourceValues: SkipLastValue[];
  outputs: SkipLastOutput[];
};

const INITIAL_STATE: SkipLastDemoState = {
  running: false,
  status: "点击运行，观察 skipLast(2) 如何缓存并丢弃最后 2 个值",
  sourceValues: [],
  outputs: [],
};

export class SkipLastDemoModel {
  private readonly stateSubject = new BehaviorSubject<SkipLastDemoState>(INITIAL_STATE);
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
      status: "source$ 发出 0 到 5，skipLast(2) 始终保留最后 2 个候选值",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = interval(450).pipe(
      take(6),
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, pending: value >= 4, at: stamp() }],
          status: `${value} 进入 skipLast 缓冲区；只有确定它不是最后 2 个值时才会输出`,
        });
      }),
      skipLast(2),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `skipLast(2) 确认 ${value} 不是最后 2 个值，转发给下游`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "skipLast(2) 完成：最后 2 个值被丢弃，其余值已转发",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，skipLast 演示终止",
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

  private patchState(patch: Partial<SkipLastDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
