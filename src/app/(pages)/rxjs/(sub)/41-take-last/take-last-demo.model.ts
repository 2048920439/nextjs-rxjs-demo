import { BehaviorSubject, interval, map, type Subscription, take, takeLast, tap } from "rxjs";

export type TakeLastValue = {
  value: number;
  at: string;
};

export type TakeLastDemoState = {
  running: boolean;
  status: string;
  sourceValues: TakeLastValue[];
  outputs: TakeLastValue[];
};

const INITIAL_STATE: TakeLastDemoState = {
  running: false,
  status: "点击运行，观察 takeLast(3) 如何等上游 complete 后输出最后 3 个值",
  sourceValues: [],
  outputs: [],
};

export class TakeLastDemoModel {
  private readonly stateSubject = new BehaviorSubject<TakeLastDemoState>(INITIAL_STATE);
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
      status: "source$ 开始发出 0 到 4，takeLast(3) 先缓存候选值",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = interval(450).pipe(
      take(5),
      map((value) => value),
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `${value} 已进入 takeLast 缓冲区，暂时不输出`,
        });
      }),
      takeLast(3),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `source$ 已 complete，takeLast 输出缓存值 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "takeLast(3) 完成：只在上游 complete 后输出最后 3 个值",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，takeLast 演示终止",
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

  private patchState(patch: Partial<TakeLastDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
