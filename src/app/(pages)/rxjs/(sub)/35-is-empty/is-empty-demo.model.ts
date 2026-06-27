import { BehaviorSubject, concat, delay, EMPTY, isEmpty, type Observable, of, type Subscription, tap } from "rxjs";

export type IsEmptyMode = "empty" | "not-empty";

export type IsEmptySourceValue = {
  value: string;
  at: string;
};

export type IsEmptyResult = {
  value: boolean;
  at: string;
};

export type IsEmptyDemoState = {
  running: boolean;
  mode: IsEmptyMode;
  status: string;
  sourceValues: IsEmptySourceValue[];
  result: IsEmptyResult | null;
};

const INITIAL_STATE: IsEmptyDemoState = {
  running: false,
  mode: "empty",
  status: "选择一个场景，观察 isEmpty 如何判断上游是否为空",
  sourceValues: [],
  result: null,
};

function createSource(mode: IsEmptyMode): Observable<string> {
  if (mode === "empty") {
    return EMPTY.pipe(delay(700));
  }

  return concat(of("first").pipe(delay(700)), of("second").pipe(delay(700)));
}

export class IsEmptyDemoModel {
  private readonly stateSubject = new BehaviorSubject<IsEmptyDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: IsEmptyMode) {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: mode === "empty" ? "source$ 不发任何 next，只在延迟后 complete" : "source$ 将发出 first，isEmpty 看到第一个 next 就能判断不空",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = createSource(mode).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，isEmpty 已经可以输出 false`,
        });
      }),
      isEmpty(),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          result: { value, at: stamp() },
          status: value ? "source$ complete 前没有任何 next，isEmpty 输出 true" : "source$ 出现第一个 next，isEmpty 输出 false 并结束",
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "isEmpty 完成：输出唯一布尔值后立刻 complete",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，isEmpty 演示终止",
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

  private patchState(patch: Partial<IsEmptyDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
