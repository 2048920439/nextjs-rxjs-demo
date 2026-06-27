import { BehaviorSubject, interval, map, reduce, type Subscription, take, tap } from "rxjs";

export type ReduceStep = {
  current: number;
  accumulation: number;
  at: string;
};

export type ReduceResult = {
  value: number;
  at: string;
};

export type ReduceDemoState = {
  running: boolean;
  status: string;
  steps: ReduceStep[];
  result: ReduceResult | null;
};

const INITIAL_STATE: ReduceDemoState = {
  running: false,
  status: "点击运行，观察 reduce 如何把多个值规约成一个结果",
  steps: [],
  result: null,
};

export class ReduceDemoModel {
  private readonly stateSubject = new BehaviorSubject<ReduceDemoState>(INITIAL_STATE);
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
      status: "source$ 开始发出 1 到 6，reduce 使用 seed=0 累加",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let previewAccumulation = 0;

    const source$ = interval(350).pipe(
      take(6),
      map((index) => index + 1),
      tap((current) => {
        previewAccumulation += current;
        this.patchState({
          steps: [...this.state.steps, { current, accumulation: previewAccumulation, at: stamp() }],
          status: `source$ 发出 ${current}，规约累计值将变为 ${previewAccumulation}`,
        });
      }),
      reduce((acc, current) => acc + current, 0),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          result: { value, at: stamp() },
          status: `source$ 已 complete，reduce 输出唯一结果 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "reduce 完成：所有值被规约成一个最终和",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，reduce 演示终止",
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

  private patchState(patch: Partial<ReduceDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
