import { BehaviorSubject, catchError, concat, defer, delay, delayWhen, map, of, retryWhen, scan, type Subscription, tap, timer } from "rxjs";

export type RetryWhenSourceValue = {
  attempt: number;
  value: number;
  at: string;
};

export type RetryWhenResult = {
  attempt: number;
  value: number;
  kind: "pass" | "recovery";
  label: string;
  at: string;
};

export type RetryWhenErrorEvent = {
  attempt: number;
  message: string;
  at: string;
};

export type RetryWhenRetryEvent = {
  retry: number;
  delayMs: number;
  at: string;
};

export type RetryWhenDemoState = {
  running: boolean;
  status: string;
  sourceValues: RetryWhenSourceValue[];
  outputs: RetryWhenResult[];
  errors: RetryWhenErrorEvent[];
  retryEvents: RetryWhenRetryEvent[];
};

const SOURCE_VALUES = [1, 2, 3, 4, 5];
const MAX_RETRIES = 2;

const INITIAL_STATE: RetryWhenDemoState = {
  running: false,
  status: "点击运行，观察 retryWhen 如何用 notifier 延时并限制重试",
  sourceValues: [],
  outputs: [],
  errors: [],
  retryEvents: [],
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

export class RetryWhenDemoModel {
  private readonly stateSubject = new BehaviorSubject<RetryWhenDemoState>(INITIAL_STATE);
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
      status: "第一次订阅开始；错误会进入 retryWhen 的 err$，由 notifier 决定何时重试",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let attempt = 0;

    const error$ = defer(() => {
      attempt += 1;
      this.patchState({
        status: `第 ${attempt} 次订阅开始，等待 source$ 发值`,
      });

      return createSource$().pipe(
        tap((value) => {
          this.patchState({
            sourceValues: [...this.state.sourceValues, { attempt, value, at: stamp() }],
            status: `第 ${attempt} 次订阅发出 ${value}${value === 4 ? "，错误进入 err$" : ""}`,
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
            this.patchState({
              errors: [...this.state.errors, { attempt, message: getErrorMessage(error), at: stamp() }],
              status: `第 ${attempt} 次订阅失败，notifier 将决定是否重试`,
            });
          },
        }),
      );
    });

    const result$ = error$.pipe(
      retryWhen((errors$) =>
        errors$.pipe(
          scan((retryCount, error: unknown) => {
            if (retryCount >= MAX_RETRIES) {
              throw error;
            }

            return retryCount + 1;
          }, 0),
          tap((retry) => {
            const delayMs = retry * 1000;

            this.patchState({
              retryEvents: [...this.state.retryEvents, { retry, delayMs, at: stamp() }],
              status: `notifier 输出第 ${retry} 次重试信号，但会先等待 ${delayMs}ms`,
            });
          }),
          delayWhen((retry) => timer(retry * 1000)),
        ),
      ),
      catchError((error: unknown) => {
        this.patchState({
          status: `retryWhen 达到上限后抛出 ${getErrorMessage(error)}，交给 catchError 恢复`,
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
          status: result.kind === "recovery" ? "catchError 输出 8，延时重试示例完成" : `result$ 收到 ${result.value}，来自第 ${result.attempt} 次订阅`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "retryWhen 完成：notifier 控制了两次延时重试，最终由 catchError 恢复",
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

  private patchState(patch: Partial<RetryWhenDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
