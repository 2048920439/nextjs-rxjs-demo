import { BehaviorSubject, interval, map, type Subscription, takeWhile, tap } from "rxjs";

export type TakeWhileValue = {
  value: number;
  passed: boolean;
  at: string;
};

export type TakeWhileOutput = {
  value: number;
  at: string;
};

export type TakeWhileDemoState = {
  running: boolean;
  status: string;
  sourceValues: TakeWhileValue[];
  outputs: TakeWhileOutput[];
};

const INITIAL_STATE: TakeWhileDemoState = {
  running: false,
  status: "点击运行，观察 takeWhile 如何在 predicate 第一次 false 时结束",
  sourceValues: [],
  outputs: [],
};

export class TakeWhileDemoModel {
  private readonly stateSubject = new BehaviorSubject<TakeWhileDemoState>(INITIAL_STATE);
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
      status: "source$ 开始发出 1 到 6，takeWhile 使用 value < 4 判定",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = interval(450).pipe(
      map((index) => index + 1),
      tap((value) => {
        const passed = value < 4;
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, passed, at: stamp() }],
          status: passed ? `${value} 满足 value < 4，takeWhile 立即转发` : `${value} 不满足条件，takeWhile 立刻 complete`,
        });
      }),
      takeWhile((value) => value < 4),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `takeWhile 转发 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "takeWhile 完成：遇到第一个 false 后停止",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，takeWhile 演示终止",
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

  private patchState(patch: Partial<TakeWhileDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
