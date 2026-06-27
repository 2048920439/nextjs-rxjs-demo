import { BehaviorSubject, concat, delay, find, findIndex, forkJoin, of, share, type Subscription, tap } from "rxjs";

export type FindIndexMode = "found" | "missing";

export type FindIndexSourceValue = {
  value: number;
  at: string;
};

export type FindIndexResult = {
  found: number | undefined;
  index: number;
  at: string;
};

export type FindIndexDemoState = {
  running: boolean;
  mode: FindIndexMode;
  status: string;
  sourceValues: FindIndexSourceValue[];
  result: FindIndexResult | null;
};

const INITIAL_STATE: FindIndexDemoState = {
  running: false,
  mode: "found",
  status: "选择一个场景，观察 find 和 findIndex 如何寻找第一个匹配值",
  sourceValues: [],
  result: null,
};

const SCENARIOS: Record<FindIndexMode, { values: number[]; predicate: (value: number) => boolean; label: string }> = {
  found: {
    values: [3, 1, 4, 1, 5, 9],
    predicate: (value) => value % 2 === 0,
    label: "寻找第一个偶数，遇到 4 时立刻输出",
  },
  missing: {
    values: [3, 1, 5, 9],
    predicate: (value) => value % 2 === 0,
    label: "没有偶数，必须等 source$ complete 才知道找不到",
  },
};

export class FindIndexDemoModel {
  private readonly stateSubject = new BehaviorSubject<FindIndexDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: FindIndexMode) {
    this.subscription?.unsubscribe();
    const scenario = SCENARIOS[mode];

    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: scenario.label,
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = concat(...scenario.values.map((value) => of(value).pipe(delay(400)))).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `${value} 进入 predicate，find/findIndex 检查是否匹配`,
        });
      }),
      share(),
    );

    this.subscription = forkJoin({
      found: source$.pipe(find(scenario.predicate)),
      index: source$.pipe(findIndex(scenario.predicate)),
    }).subscribe({
      next: ({ found, index }) => {
        this.patchState({
          result: { found, index, at: stamp() },
          status: index >= 0 ? `找到第一个匹配值 ${found}，序号为 ${index}` : "source$ 已 complete，没有找到匹配值",
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "find/findIndex 完成：输出唯一结果后立刻 complete",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，find/findIndex 演示终止",
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

  private patchState(patch: Partial<FindIndexDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
