import { BehaviorSubject, catchError, concat, defer, delay, map, type Observable, of, type Subscription, take, tap } from "rxjs";

export type CatchErrorMode = "single" | "repeat" | "caught";

export type CatchErrorSourceValue = {
  attempt: number;
  value: number;
  at: string;
};

export type CatchErrorResult = {
  attempt: number;
  value: number;
  kind: "pass" | "recovery";
  label: string;
  at: string;
};

export type CatchErrorEvent = {
  attempt: number;
  message: string;
  action: string;
  at: string;
};

export type CatchErrorDemoState = {
  running: boolean;
  mode: CatchErrorMode;
  status: string;
  sourceValues: CatchErrorSourceValue[];
  outputs: CatchErrorResult[];
  errors: CatchErrorEvent[];
};

type StreamResult = Omit<CatchErrorResult, "at">;

const SOURCE_VALUES = [1, 2, 3, 4, 5];

const INITIAL_STATE: CatchErrorDemoState = {
  running: false,
  mode: "single",
  status: "选择一种恢复方式，观察 catchError 如何把 error 转换为新的 Observable",
  sourceValues: [],
  outputs: [],
  errors: [],
};

const MODE_STATUS: Record<CatchErrorMode, string> = {
  single: "catchError 捕获 unlucky number 4 后，用 of(8) 恢复一次",
  repeat: "catchError 捕获错误后，返回 8 个恢复值，说明 selector 可以返回任意 Observable",
  caught: "catchError 返回 caught$ 重新订阅上游，再用 take(10) 截断循环",
};

function createSource$() {
  return concat(...SOURCE_VALUES.map((value, index) => of(value).pipe(delay(index === 0 ? 0 : 500))));
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

function createRecovery$(mode: Exclude<CatchErrorMode, "caught">, attempt: number): Observable<StreamResult> {
  if (mode === "single") {
    return of({
      attempt,
      value: 8,
      kind: "recovery" as const,
      label: "of(8)",
    }).pipe(delay(500));
  }

  return concat(
    ...Array.from({ length: 8 }, (_, index) =>
      of({
        attempt,
        value: 8,
        kind: "recovery" as const,
        label: `repeat ${index + 1}`,
      }).pipe(delay(180)),
    ),
  );
}

export class CatchErrorDemoModel {
  private readonly stateSubject = new BehaviorSubject<CatchErrorDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: CatchErrorMode) {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: MODE_STATUS[mode],
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let attempt = 0;

    const error$ = defer(() => {
      attempt += 1;

      return createSource$().pipe(
        tap((value) => {
          this.patchState({
            sourceValues: [...this.state.sourceValues, { attempt, value, at: stamp() }],
            status: `第 ${attempt} 次订阅：source$ 发出 ${value}${value === 4 ? "，map 将抛出错误" : ""}`,
          });
        }),
        map((value) => ({
          attempt,
          value: throwOnUnluckyNumber(value),
          kind: "pass" as const,
          label: `attempt ${attempt}`,
        })),
      );
    });

    const recovered$ = error$.pipe(
      catchError((error: unknown, caught$: Observable<StreamResult>) => {
        const action = mode === "caught" ? "返回 caught$ 重试上游" : mode === "repeat" ? "返回 8 个恢复值" : "返回 of(8)";

        this.patchState({
          errors: [...this.state.errors, { attempt, message: getErrorMessage(error), action, at: stamp() }],
          status: `catchError 捕获 ${getErrorMessage(error)}，${action}`,
        });

        if (mode === "caught") {
          return caught$;
        }

        return createRecovery$(mode, attempt);
      }),
    );

    const result$ = mode === "caught" ? recovered$.pipe(take(10)) : recovered$;

    this.subscription = result$.subscribe({
      next: (result) => {
        this.patchState({
          outputs: [...this.state.outputs, { ...result, at: stamp() }],
          status:
            result.kind === "recovery"
              ? `catchError 输出恢复值 ${result.value}（${result.label}）`
              : `下游收到正常值 ${result.value}，来自第 ${result.attempt} 次订阅`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status:
            mode === "caught"
              ? "catchError 返回 caught$ 会不断重试；这里用 take(10) 截断为书中的序列"
              : "catchError 用恢复 Observable 结束了错误分支，Observer 没有收到 error",
        });
      },
      error: (error: unknown) => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: `error 继续传给 Observer：${getErrorMessage(error)}`,
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

  private patchState(patch: Partial<CatchErrorDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
