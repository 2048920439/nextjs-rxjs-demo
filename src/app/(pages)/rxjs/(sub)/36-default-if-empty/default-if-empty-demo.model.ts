import { BehaviorSubject, concat, defaultIfEmpty, delay, EMPTY, type Observable, of, type Subscription, tap } from "rxjs";

export type DefaultIfEmptyMode = "empty" | "not-empty";

export type DefaultOutput = {
  value: string;
  source: "source" | "default";
  at: string;
};

export type DefaultIfEmptyDemoState = {
  running: boolean;
  mode: DefaultIfEmptyMode;
  status: string;
  sourceValues: string[];
  outputs: DefaultOutput[];
};

const DEFAULT_VALUE = "this is default";

const INITIAL_STATE: DefaultIfEmptyDemoState = {
  running: false,
  mode: "empty",
  status: "选择一个场景，观察 defaultIfEmpty 如何补默认值",
  sourceValues: [],
  outputs: [],
};

function createSource(mode: DefaultIfEmptyMode): Observable<string> {
  if (mode === "empty") {
    return EMPTY.pipe(delay(700));
  }

  return concat(of("A").pipe(delay(400)), of("B").pipe(delay(400)), of("C").pipe(delay(400)));
}

export class DefaultIfEmptyDemoModel {
  private readonly stateSubject = new BehaviorSubject<DefaultIfEmptyDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: DefaultIfEmptyMode) {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: mode === "empty" ? "source$ 将不发 next，complete 时由 defaultIfEmpty 补默认值" : "source$ 会发出 A、B、C，defaultIfEmpty 原样转发",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = createSource(mode).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, value],
          status: `source$ 发出 ${value}，defaultIfEmpty 直接转发`,
        });
      }),
      defaultIfEmpty(DEFAULT_VALUE),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        const source = value === DEFAULT_VALUE ? "default" : "source";
        this.patchState({
          outputs: [...this.state.outputs, { value, source, at: stamp() }],
          status: source === "default" ? "source$ 已空完成，defaultIfEmpty 输出默认值" : `defaultIfEmpty 转发 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "defaultIfEmpty 完成：空流补默认值，非空流保持原样",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，defaultIfEmpty 演示终止",
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

  private patchState(patch: Partial<DefaultIfEmptyDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
