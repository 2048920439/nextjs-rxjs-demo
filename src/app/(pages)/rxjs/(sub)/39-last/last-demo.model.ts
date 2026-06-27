import { BehaviorSubject, concat, delay, last, of, type Subscription, tap } from "rxjs";

export type LastMode = "plain" | "predicate" | "default";

export type LastSourceValue = {
  value: number;
  candidate: boolean;
  at: string;
};

export type LastResult = {
  value: number;
  at: string;
};

export type LastDemoState = {
  running: boolean;
  mode: LastMode;
  status: string;
  sourceValues: LastSourceValue[];
  result: LastResult | null;
};

const INITIAL_STATE: LastDemoState = {
  running: false,
  mode: "plain",
  status: "选择一个场景，观察 last 如何等待上游 complete",
  sourceValues: [],
  result: null,
};

const VALUES = [3, 1, 4, 1, 5, 9, 2, 6];

export class LastDemoModel {
  private readonly stateSubject = new BehaviorSubject<LastDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: LastMode) {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: this.getStartStatus(mode),
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = concat(...VALUES.map((value) => of(value).pipe(delay(350)))).pipe(
      tap((value) => {
        const candidate = this.isCandidate(value, mode);
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, candidate, at: stamp() }],
          status: candidate ? `${value} 是当前候选值，但 last 还要继续等 complete` : `${value} 不满足当前 last 条件`,
        });
      }),
    );

    const result$ =
      mode === "plain"
        ? source$.pipe(last())
        : mode === "predicate"
          ? source$.pipe(last((value) => value % 2 === 0))
          : source$.pipe(last((value) => value < 0, -1));

    this.subscription = result$.subscribe({
      next: (value) => {
        this.patchState({
          result: { value, at: stamp() },
          status: `source$ 已 complete，last 输出最终值 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "last 完成：只在上游 complete 后输出一次",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "没有匹配值且未提供默认值，last 会抛出 EmptyError",
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

  private getStartStatus(mode: LastMode) {
    if (mode === "plain") return "last() 不带 predicate，会等 complete 后取上游最后一个值";
    if (mode === "predicate") return "last 查找最后一个偶数，候选值会被后面的偶数覆盖";
    return "last 查找小于 0 的值，找不到时输出默认值 -1";
  }

  private isCandidate(value: number, mode: LastMode) {
    if (mode === "plain") return true;
    if (mode === "predicate") return value % 2 === 0;
    return value < 0;
  }

  private patchState(patch: Partial<LastDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
