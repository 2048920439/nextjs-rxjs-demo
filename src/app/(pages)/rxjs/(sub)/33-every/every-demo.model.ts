import { BehaviorSubject, concat, delay, every, of, type Subscription, tap } from "rxjs";

export type EveryMode = "all-pass" | "fail-fast";

export type EverySourceValue = {
  value: number;
  at: string;
};

export type EveryResult = {
  value: boolean;
  at: string;
};

export type EveryDemoState = {
  running: boolean;
  mode: EveryMode;
  status: string;
  sourceValues: EverySourceValue[];
  result: EveryResult | null;
};

const INITIAL_STATE: EveryDemoState = {
  running: false,
  mode: "all-pass",
  status: "选择一个场景，观察 every 的判定时机",
  sourceValues: [],
  result: null,
};

const SCENARIOS: Record<EveryMode, { values: number[]; predicate: (value: number) => boolean; status: string }> = {
  "all-pass": {
    values: [3, 1, 4, 1, 5, 9],
    predicate: (value) => value > 0,
    status: "所有值都大于 0，every 必须等 source$ complete 才能输出 true",
  },
  "fail-fast": {
    values: [0, 1, 2, 3, 4],
    predicate: (value) => value < 3,
    status: "当值 3 不满足 x < 3 时，every 会立刻输出 false 并退订上游",
  },
};

export class EveryDemoModel {
  private readonly stateSubject = new BehaviorSubject<EveryDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: EveryMode) {
    this.subscription?.unsubscribe();
    const scenario = SCENARIOS[mode];

    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: scenario.status,
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = concat(...scenario.values.map((value) => of(value).pipe(delay(400)))).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `${value} 进入 predicate，every 继续判断`,
        });
      }),
      every(scenario.predicate),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          result: { value, at: stamp() },
          status: value ? "source$ 已 complete，所有值都通过判定，every 输出 true" : "发现第一个不满足条件的值，every 输出 false",
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "every 完成：输出唯一布尔值后立刻 complete",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，every 演示终止",
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

  private patchState(patch: Partial<EveryDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
