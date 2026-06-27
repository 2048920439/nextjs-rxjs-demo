import { BehaviorSubject, concat, delay, first, map, type Observable, of, type Subscription, tap } from "rxjs";

export type FirstMode = "plain" | "predicate" | "default";

export type FirstSourceValue = {
  value: number;
  at: string;
};

export type FirstResult = {
  value: number | [number, number];
  at: string;
};

export type FirstDemoState = {
  running: boolean;
  mode: FirstMode;
  status: string;
  sourceValues: FirstSourceValue[];
  result: FirstResult | null;
};

const INITIAL_STATE: FirstDemoState = {
  running: false,
  mode: "plain",
  status: "选择一个场景，观察 first 如何找到第一个值",
  sourceValues: [],
  result: null,
};

const VALUES = [3, 1, 4, 1, 5, 9];

export class FirstDemoModel {
  private readonly stateSubject = new BehaviorSubject<FirstDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: FirstMode) {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: this.getStartStatus(mode),
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = concat(...VALUES.map((value) => of(value).pipe(delay(400)))).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `${value} 已进入 first 的判定范围`,
        });
      }),
    );

    const result$: Observable<FirstResult["value"]> =
      mode === "plain"
        ? source$.pipe(first())
        : mode === "predicate"
          ? source$.pipe(
              map((value, index) => ({ value, index })),
              first((item) => item.value % 2 === 0),
              map((item) => [item.value, item.index] as [number, number]),
            )
          : source$.pipe(first((value) => value < 0, -1));

    this.subscription = result$.subscribe({
      next: (value) => {
        this.patchState({
          result: { value, at: stamp() },
          status: `first 输出 ${Array.isArray(value) ? `[${value.join(", ")}]` : value}，随后 complete`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "first 完成：找到目标后立即结束",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "没有匹配值且未提供默认值，first 会抛出 EmptyError",
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

  private getStartStatus(mode: FirstMode) {
    if (mode === "plain") return "first() 不带 predicate，会拿第一个上游值";
    if (mode === "predicate") return "first 查找第一个偶数，并用 map 保留它的序号";
    return "first 查找小于 0 的值，找不到时输出默认值 -1";
  }

  private patchState(patch: Partial<FirstDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
