import { BehaviorSubject, interval, skip, type Subscription, take, tap } from "rxjs";

export type SkipValue = {
  value: number;
  skipped: boolean;
  at: string;
};

export type SkipOutput = {
  value: number;
  at: string;
};

export type SkipDemoState = {
  running: boolean;
  status: string;
  sourceValues: SkipValue[];
  outputs: SkipOutput[];
};

const INITIAL_STATE: SkipDemoState = {
  running: false,
  status: "点击运行，观察 skip(3) 如何忽略上游前 3 个值",
  sourceValues: [],
  outputs: [],
};

export class SkipDemoModel {
  private readonly stateSubject = new BehaviorSubject<SkipDemoState>(INITIAL_STATE);
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
      status: "source$ 开始发出 0 到 6，skip(3) 会静默丢弃 0、1、2",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = interval(450).pipe(
      take(7),
      tap((value) => {
        const skipped = value < 3;
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, skipped, at: stamp() }],
          status: skipped ? `${value} 属于前 3 个值，被 skip(3) 丢弃` : `${value} 已越过 skip(3) 的边界，会进入下游`,
        });
      }),
      skip(3),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `skip(3) 转发 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "skip(3) 完成：前 3 个值被跳过，之后的值保持原样转发",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，skip 演示终止",
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

  private patchState(patch: Partial<SkipDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
