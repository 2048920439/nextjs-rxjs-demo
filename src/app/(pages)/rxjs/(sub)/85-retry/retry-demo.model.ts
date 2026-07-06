import { BehaviorSubject, catchError, concat, defer, delay, map, of, retry, type Subscription, tap } from "rxjs";

export type RetrySourceValue = {
  attempt: number;
  value: number;
  at: string;
};

export type RetryResult = {
  attempt: number;
  value: number;
  kind: "pass" | "recovery";
  label: string;
  at: string;
};

export type RetryErrorEvent = {
  attempt: number;
  message: string;
  action: string;
  at: string;
};

export type RetryDemoState = {
  running: boolean;
  status: string;
  sourceValues: RetrySourceValue[];
  outputs: RetryResult[];
  errors: RetryErrorEvent[];
};

const SOURCE_VALUES = [1, 2, 3, 4, 5];
const MAX_RETRIES = 2;

const INITIAL_STATE: RetryDemoState = {
  running: false,
  status: "点击运行，观察 retry(2) 如何在错误后立即重新订阅上游",
  sourceValues: [],
  outputs: [],
  errors: [],
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

export class RetryDemoModel {
  private readonly stateSubject = new BehaviorSubject<RetryDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      status: "第一次订阅开始；遇到 4 会抛错，retry(2) 会立即重新订阅",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let attempt = 0;

    const error$ = defer(() => {
      attempt += 1;
      this.patchState({
        status: `第 ${attempt} 次订阅开始，source$ 从 1 重新发出`,
      });

      return createSource$().pipe(
        tap((value) => {
          this.patchState({
            sourceValues: [...this.state.sourceValues, { attempt, value, at: stamp() }],
            status: `第 ${attempt} 次订阅发出 ${value}${value === 4 ? "，即将进入 error" : ""}`,
          });
        }),
        map((value) => ({
          attempt,
          value: throwOnUnluckyNumber(value),
          kind: "pass" as const,
          label: `try ${attempt}`,
        })),
        tap({
          error: (error: unknown) => {
            const action = attempt <= MAX_RETRIES ? "retry 立即重新订阅" : "重试次数耗尽，交给 catchError";

            this.patchState({
              errors: [...this.state.errors, { attempt, message: getErrorMessage(error), action, at: stamp() }],
              status: `第 ${attempt} 次订阅失败：${action}`,
            });
          },
        }),
      );
    });

    const result$ = error$.pipe(
      retry(MAX_RETRIES),
      catchError((error: unknown) => {
        this.patchState({
          status: `catchError 收到最终错误 ${getErrorMessage(error)}，输出恢复值 8`,
        });

        return of({
          attempt,
          value: 8,
          kind: "recovery" as const,
          label: "catchError",
        }).pipe(delay(500));
      }),
    );

    this.subscription = result$.subscribe({
      next: (result) => {
        this.patchState({
          outputs: [...this.state.outputs, { ...result, at: stamp() }],
          status: result.kind === "recovery" ? "catchError 输出 8，retry 示例完成恢复" : `result$ 收到 ${result.value}，来自第 ${result.attempt} 次订阅`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "retry(2) 完成：两次重试后仍失败，最终由 catchError 输出 8",
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

  private patchState(patch: Partial<RetryDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
