import { BehaviorSubject, map, startWith, type Subscription, take, tap, timer } from "rxjs";

export type StartWithOutput = {
  value: string;
  source: "startWith" | "original";
  at: string;
};

export type StartWithDemoState = {
  running: boolean;
  status: string;
  originalValues: StartWithOutput[];
  outputs: StartWithOutput[];
};

const INITIAL_STATE: StartWithDemoState = {
  running: false,
  status: "点击运行，观察 startWith 在订阅时先同步输出起始值",
  originalValues: [],
  outputs: [],
};

export class StartWithDemoModel {
  private readonly stateSubject = new BehaviorSubject<StartWithDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.patchState({
      running: true,
      status: "已订阅：startWith 会先吐出 start，然后等待 original$",
      originalValues: [],
      outputs: [],
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const original$ = timer(1000, 1000).pipe(
      take(3),
      map((value) => String(value)),
      tap((value) => {
        this.patchState({
          originalValues: [
            ...this.state.originalValues,
            {
              value,
              source: "original",
              at: stamp(),
            },
          ],
        });
      }),
    );

    this.subscription = original$.pipe(startWith("start")).subscribe({
      next: (value) => {
        const output: StartWithOutput = {
          value,
          source: value === "start" ? "startWith" : "original",
          at: stamp(),
        };

        this.patchState({
          outputs: [...this.state.outputs, output],
          status: output.source === "startWith" ? "startWith 同步输出起始值" : `original$ 输出 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "result$ 完成：startWith 不改变上游的完成时机",
        });
      },
      error: (error) => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: `发生错误：${String(error)}`,
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

  private patchState(patch: Partial<StartWithDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
