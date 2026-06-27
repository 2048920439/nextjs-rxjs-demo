import { BehaviorSubject, interval, type Subscription, take, tap } from "rxjs";

export type TakeValue = {
  value: number;
  at: string;
};

export type TakeDemoState = {
  running: boolean;
  status: string;
  sourceValues: TakeValue[];
  outputs: TakeValue[];
};

const INITIAL_STATE: TakeDemoState = {
  running: false,
  status: "点击运行，观察 take(3) 如何只拿上游前 3 个值",
  sourceValues: [],
  outputs: [],
};

export class TakeDemoModel {
  private readonly stateSubject = new BehaviorSubject<TakeDemoState>(INITIAL_STATE);
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
      status: "source$ 开始发值，take(3) 会转发前三个值",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = interval(500).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，take 检查是否还没拿够 3 个`,
        });
      }),
      take(3),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `take(3) 转发 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "take(3) 已拿够 3 个值，主动 complete 并退订上游",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，take 演示终止",
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

  private patchState(patch: Partial<TakeDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
