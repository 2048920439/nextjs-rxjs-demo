import { BehaviorSubject, forkJoin, interval, map, type Subscription, take, tap } from "rxjs";

export type ForkJoinValue = {
  value: string;
  at: string;
};

export type ForkJoinResult = {
  source1: string;
  source2: string;
  at: string;
};

export type ForkJoinDemoState = {
  running: boolean;
  status: string;
  source1Values: ForkJoinValue[];
  source2Values: ForkJoinValue[];
  result: ForkJoinResult | null;
};

const INITIAL_STATE: ForkJoinDemoState = {
  running: false,
  status: "点击运行，观察 forkJoin 如何等待所有输入完成",
  source1Values: [],
  source2Values: [],
  result: null,
};

export class ForkJoinDemoModel {
  private readonly stateSubject = new BehaviorSubject<ForkJoinDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.patchState({
      running: true,
      status: "forkJoin 已订阅：等待 source1$ 和 source2$ 都 complete",
      source1Values: [],
      source2Values: [],
      result: null,
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source1$ = interval(1000).pipe(
      take(1),
      map((value) => `${value}a`),
      tap((value) => {
        this.patchState({
          source1Values: [...this.state.source1Values, { value, at: stamp() }],
          status: `source1$ 发出 ${value} 并完成，但 forkJoin 还要等 source2$`,
        });
      }),
    );

    const source2$ = interval(1000).pipe(
      take(3),
      map((value) => `${value}b`),
      tap((value) => {
        this.patchState({
          source2Values: [...this.state.source2Values, { value, at: stamp() }],
          status: value === "2b" ? "source2$ 发出最后一个值，forkJoin 即将输出" : `source2$ 发出 ${value}，继续等待完成`,
        });
      }),
    );

    this.subscription = forkJoin([source1$, source2$]).subscribe({
      next: ([source1, source2]) => {
        this.patchState({
          result: { source1, source2, at: stamp() },
          status: `forkJoin 输出最后值：[${source1}, ${source2}]`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "forkJoin 完成：只输出一次，然后 complete",
        });
      },
      error: (error) => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: `发生错误：${String(error)}`,
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

  private patchState(patch: Partial<ForkJoinDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
