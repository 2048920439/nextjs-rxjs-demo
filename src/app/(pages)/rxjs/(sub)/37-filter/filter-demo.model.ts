import { BehaviorSubject, filter, interval, map, type Subscription, take, tap } from "rxjs";

export type FilterSourceValue = {
  value: number;
  passed: boolean;
  at: string;
};

export type FilterOutput = {
  value: number;
  at: string;
};

export type FilterDemoState = {
  running: boolean;
  status: string;
  sourceValues: FilterSourceValue[];
  outputs: FilterOutput[];
};

const INITIAL_STATE: FilterDemoState = {
  running: false,
  status: "点击运行，观察 filter 如何只让偶数进入下游",
  sourceValues: [],
  outputs: [],
};

export class FilterDemoModel {
  private readonly stateSubject = new BehaviorSubject<FilterDemoState>(INITIAL_STATE);
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
      status: "source$ 开始发出 1 到 5，filter 逐个判定是否为偶数",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = interval(450).pipe(
      take(5),
      map((index) => index + 1),
      tap((value) => {
        const passed = value % 2 === 0;
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, passed, at: stamp() }],
          status: passed ? `${value} 满足 x % 2 === 0，会立刻进入下游` : `${value} 不满足条件，被 filter 丢弃`,
        });
      }),
      filter((value) => value % 2 === 0),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `even$ 收到 ${value}，输出时机紧跟上游 next`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "filter 完成：上游 complete 后，下游也 complete",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，filter 演示终止",
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

  private patchState(patch: Partial<FilterDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
