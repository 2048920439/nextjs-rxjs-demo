import { BehaviorSubject, concat, delay, of, single, type Subscription, tap } from "rxjs";

export type SingleMode = "unique" | "multiple";

export type SingleSourceValue = {
  value: number;
  matched: boolean;
  at: string;
};

export type SingleResult =
  | {
      kind: "value";
      value: number;
      message: string;
      at: string;
    }
  | {
      kind: "error";
      message: string;
      at: string;
    };

export type SingleDemoState = {
  running: boolean;
  mode: SingleMode;
  status: string;
  sourceValues: SingleSourceValue[];
  result: SingleResult | null;
};

const INITIAL_STATE: SingleDemoState = {
  running: false,
  mode: "unique",
  status: "选择一个场景，观察 single 如何要求唯一匹配",
  sourceValues: [],
  result: null,
};

const VALUES: Record<SingleMode, number[]> = {
  unique: [0, 1],
  multiple: [0, 1, 2],
};

export class SingleDemoModel {
  private readonly stateSubject = new BehaviorSubject<SingleDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: SingleMode) {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: mode === "unique" ? "source$ 只有一个偶数 0；single 要等 complete 才能确认唯一" : "source$ 会出现 0 和 2 两个偶数；第二个匹配会触发错误",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const result$ = concat(...VALUES[mode].map((value) => of(value).pipe(delay(400)))).pipe(
      tap((value) => {
        const matched = value % 2 === 0;
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, matched, at: stamp() }],
          status: matched ? `${value} 满足偶数条件，single 记录一个候选值` : `${value} 不满足条件，被 single 忽略`,
        });
      }),
      single((value) => value % 2 === 0),
    );

    this.subscription = result$.subscribe({
      next: (value) => {
        this.patchState({
          result: { kind: "value", value, message: "唯一匹配", at: stamp() },
          status: `上游 complete 后确认只有一个偶数，single 输出 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "single 完成：唯一匹配值已输出",
        });
      },
      error: (error: Error) => {
        this.subscription = null;
        this.patchState({
          running: false,
          result: { kind: "error", message: error.message, at: stamp() },
          status: "single 发现第二个匹配值，立即进入错误路径",
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

  private patchState(patch: Partial<SingleDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
