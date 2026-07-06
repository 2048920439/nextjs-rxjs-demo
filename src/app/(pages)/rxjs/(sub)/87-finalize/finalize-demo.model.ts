import { BehaviorSubject, catchError, concat, delay, finalize, map, type Observable, of, type Subscription, tap } from "rxjs";

export type FinalizeMode = "complete" | "recover" | "error";

export type FinalizeSourceValue = {
  value: number;
  at: string;
};

export type FinalizeOutput = {
  value: number;
  kind: "pass" | "recovery";
  at: string;
};

export type FinalizeEvent = {
  type: "complete" | "error" | "recover" | "finalize";
  message: string;
  at: string;
};

export type FinalizeDemoState = {
  running: boolean;
  mode: FinalizeMode;
  status: string;
  sourceValues: FinalizeSourceValue[];
  outputs: FinalizeOutput[];
  events: FinalizeEvent[];
};

const INITIAL_STATE: FinalizeDemoState = {
  running: false,
  mode: "recover",
  status: "选择一种结束方式，观察 finalize 是否都会执行",
  sourceValues: [],
  outputs: [],
  events: [],
};

const MODE_STATUS: Record<FinalizeMode, string> = {
  complete: "正常完成：source$ 发出 1、2、3 后 complete，finalize 执行一次",
  recover: "捕获恢复：4 抛错后 catchError 输出 8，然后 complete，finalize 执行一次",
  error: "直接错误：4 抛错后传给 Observer.error，finalize 仍然执行一次",
};

function createSource$(values: number[]) {
  return concat(...values.map((value, index) => of(value).pipe(delay(index === 0 ? 0 : 500))));
}

function throwOnUnluckyNumber(value: number) {
  if (value === 4) {
    throw new Error("unlucky number 4");
  }

  return value;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

export class FinalizeDemoModel {
  private readonly stateSubject = new BehaviorSubject<FinalizeDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: FinalizeMode) {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: MODE_STATUS[mode],
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    const values = mode === "complete" ? [1, 2, 3] : [1, 2, 3, 4, 5];

    const source$ = createSource$(values).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}${value === 4 && mode !== "complete" ? "，map 将抛出错误" : ""}`,
        });
      }),
      map((value) => (mode === "complete" ? value : throwOnUnluckyNumber(value))),
    );

    const handled$: Observable<number> =
      mode === "recover"
        ? source$.pipe(
            catchError((error: unknown) => {
              this.patchState({
                events: [...this.state.events, { type: "recover", message: `catchError: ${getErrorMessage(error)}`, at: stamp() }],
                status: "catchError 捕获错误并输出恢复值 8，随后会正常 complete",
              });

              return of(8).pipe(delay(500));
            }),
          )
        : source$;

    const result$ = handled$.pipe(
      finalize(() => {
        this.subscription = null;
        this.patchState({
          running: false,
          events: [...this.state.events, { type: "finalize", message: "finalize callback", at: stamp() }],
          status: "finalize 已执行：无论 complete、error 还是 catchError 恢复后 complete，收尾逻辑都会运行一次",
        });
      }),
    );

    this.subscription = result$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, kind: value === 8 ? "recovery" : "pass", at: stamp() }],
          status: value === 8 ? "result$ 输出 catchError 恢复值 8" : `result$ 输出正常值 ${value}`,
        });
      },
      complete: () => {
        this.patchState({
          events: [...this.state.events, { type: "complete", message: "Observer.complete", at: stamp() }],
          status: "Observer.complete 已触发，接下来执行 finalize",
        });
      },
      error: (error: unknown) => {
        this.patchState({
          events: [...this.state.events, { type: "error", message: `Observer.error: ${getErrorMessage(error)}`, at: stamp() }],
          status: "Observer.error 已触发，接下来执行 finalize",
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

  private patchState(patch: Partial<FinalizeDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
