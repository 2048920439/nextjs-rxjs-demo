import { BehaviorSubject, EMPTY, NEVER, type Subscription, throwError } from "rxjs";

type ResultType = "idle" | "waiting" | "complete" | "error";

type CardState = {
  result: ResultType;
  message: string;
};

export type MinimalDemoState = {
  empty: CardState;
  never: CardState;
  thrown: CardState;
};

const WAITING: CardState = { result: "idle", message: "等待订阅" };

const INITIAL_STATE: MinimalDemoState = {
  empty: WAITING,
  never: WAITING,
  thrown: WAITING,
};

export class MinimalDemoModel {
  private readonly stateSubject = new BehaviorSubject<MinimalDemoState>(INITIAL_STATE);
  private emptySubscription: Subscription | null = null;
  private neverSubscription: Subscription | null = null;
  private throwSubscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  subscribeEmpty() {
    this.patchState({ empty: { result: "waiting", message: "订阅中..." } });
    this.emptySubscription = EMPTY.subscribe({
      complete: () => this.patchState({ empty: { result: "complete", message: "complete - 直接结束，无数据" } }),
    });
  }

  subscribeNever() {
    this.patchState({ never: { result: "waiting", message: "等待中...（永不结束）" } });
    this.neverSubscription = NEVER.subscribe();
  }

  cancelNever() {
    this.neverSubscription?.unsubscribe();
    this.neverSubscription = null;
    this.patchState({ never: { result: "idle", message: "已取消订阅" } });
  }

  subscribeThrow() {
    this.patchState({ thrown: { result: "waiting", message: "订阅中..." } });
    this.throwSubscription = throwError(() => new Error("Oops!")).subscribe({
      error: (error) => this.patchState({ thrown: { result: "error", message: `catch: ${error.message}` } }),
    });
  }

  dispose() {
    this.emptySubscription?.unsubscribe();
    this.neverSubscription?.unsubscribe();
    this.throwSubscription?.unsubscribe();
  }

  private patchState(patch: Partial<MinimalDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
