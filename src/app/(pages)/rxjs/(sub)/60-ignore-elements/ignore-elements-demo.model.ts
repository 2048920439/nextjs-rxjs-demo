import { BehaviorSubject, concat, delay, ignoreElements, type Observable, of, type Subscription, tap, throwError } from "rxjs";

export type IgnoreElementsMode = "complete" | "error";

export type IgnoreSourceValue = {
  value: number;
  at: string;
};

export type IgnoreSignal = {
  type: "complete" | "error";
  message: string;
  at: string;
};

export type IgnoreElementsDemoState = {
  running: boolean;
  mode: IgnoreElementsMode;
  status: string;
  sourceValues: IgnoreSourceValue[];
  signal: IgnoreSignal | null;
};

const INITIAL_STATE: IgnoreElementsDemoState = {
  running: false,
  mode: "complete",
  status: "选择一个场景，观察 ignoreElements 如何丢弃所有 next",
  sourceValues: [],
  signal: null,
};

function createSource(mode: IgnoreElementsMode): Observable<number> {
  const values$ = concat(of(0).pipe(delay(350)), of(1).pipe(delay(350)), of(2).pipe(delay(350)));

  if (mode === "error") {
    return concat(values$, throwError(() => new Error("boom")).pipe(delay(350)));
  }

  return values$;
}

export class IgnoreElementsDemoModel {
  private readonly stateSubject = new BehaviorSubject<IgnoreElementsDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: IgnoreElementsMode) {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: mode === "complete" ? "source$ 发出 0、1、2 后 complete；next 都会被忽略" : "source$ 发出几个值后 error；next 被忽略，但 error 会传递",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const result$ = createSource(mode).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，ignoreElements 丢弃这个 next`,
        });
      }),
      ignoreElements(),
    );

    this.subscription = result$.subscribe({
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          signal: { type: "complete", message: "complete", at: stamp() },
          status: "ignoreElements 没有输出 next，只把 complete 传给下游",
        });
      },
      error: (error: Error) => {
        this.subscription = null;
        this.patchState({
          running: false,
          signal: { type: "error", message: error.message, at: stamp() },
          status: "ignoreElements 丢弃 next，但 error 会继续传给下游",
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

  private patchState(patch: Partial<IgnoreElementsDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
