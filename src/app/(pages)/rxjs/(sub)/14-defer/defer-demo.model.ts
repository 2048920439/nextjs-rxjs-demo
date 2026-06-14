import { BehaviorSubject, defer, type Observable, of, type Subscription } from "rxjs";

type DeferStage = "idle" | "created" | "subscribed";

export type DeferDemoState = {
  stage: DeferStage;
  createdAt: string | null;
  factoryCount: number;
  logs: string[];
};

const INITIAL_STATE: DeferDemoState = {
  stage: "idle",
  createdAt: null,
  factoryCount: 0,
  logs: [],
};

export class DeferDemoModel {
  private readonly stateSubject = new BehaviorSubject<DeferDemoState>(INITIAL_STATE);
  private deferred: Observable<string> | null = null;
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  get primaryLabel() {
    if (this.state.stage === "idle") return "1. 创建 deferred$";
    if (this.state.stage === "created") return "2. 订阅并执行";
    return "3. 重置";
  }

  get statusText() {
    if (this.state.stage === "idle") return "未创建";
    if (this.state.stage === "created") return "已创建 deferred$";
    return "已订阅执行";
  }

  handlePrimaryClick() {
    if (this.state.stage === "idle") {
      this.createDeferred();
      return;
    }

    if (this.state.stage === "created") {
      this.subscribeDeferred();
      return;
    }

    this.reset();
  }

  reset() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.deferred = null;
    this.stateSubject.next(INITIAL_STATE);
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private createDeferred() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.patchState({
      stage: "created",
      createdAt: new Date().toLocaleTimeString(),
      factoryCount: 0,
      logs: [],
    });

    this.deferred = defer(() => {
      this.patchState({ factoryCount: this.state.factoryCount + 1 });
      return of(new Date().toLocaleTimeString());
    });
  }

  private subscribeDeferred() {
    if (!this.deferred) return;

    this.subscription?.unsubscribe();
    this.patchState({ logs: [] });

    this.subscription = this.deferred.subscribe({
      next: (value) => this.appendLog(`next: ${value}`),
      complete: () => {
        this.appendLog("complete");
        this.patchState({ stage: "subscribed" });
      },
      error: (error) => {
        this.appendLog(`error: ${String(error)}`);
        this.patchState({ stage: "subscribed" });
      },
    });
  }

  private appendLog(line: string) {
    this.patchState({ logs: [...this.state.logs, line] });
  }

  private patchState(patch: Partial<DeferDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
