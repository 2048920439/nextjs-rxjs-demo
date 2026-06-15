import { BehaviorSubject, concatAll, interval, map, Observable, type Subscription, take, tap } from "rxjs";

export type ConcatAllInnerId = "inner0" | "inner1";

export type ConcatAllOutput = {
  inner: ConcatAllInnerId;
  value: string;
  at: string;
};

export type ConcatAllDemoState = {
  running: boolean;
  status: string;
  outerValues: string[];
  activeInner: ConcatAllInnerId | null;
  subscribedInners: ConcatAllInnerId[];
  completedInners: ConcatAllInnerId[];
  outputs: ConcatAllOutput[];
};

const INITIAL_STATE: ConcatAllDemoState = {
  running: false,
  status: "点击运行，观察 concatAll 如何顺序订阅内部 Observable",
  outerValues: [],
  activeInner: null,
  subscribedInners: [],
  completedInners: [],
  outputs: [],
};

function createInnerObservable(outerIndex: number): Observable<{ inner: ConcatAllInnerId; value: string }> {
  const inner = `inner${outerIndex}` as ConcatAllInnerId;

  return interval(750).pipe(
    take(2),
    map((innerIndex) => ({
      inner,
      value: `${outerIndex}:${innerIndex}`,
    })),
  );
}

export class ConcatAllDemoModel {
  private readonly stateSubject = new BehaviorSubject<ConcatAllDemoState>(INITIAL_STATE);
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
      status: "ho$ 开始产生内部 Observable",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const ho$ = interval(500).pipe(
      take(2),
      tap((outerIndex) => {
        const value = `inner${outerIndex}$`;
        this.patchState({
          outerValues: [...this.state.outerValues, value],
          status: `${value} 已由 ho$ 产生，等待 concatAll 的订阅策略`,
        });
      }),
      map((outerIndex) => {
        const inner = `inner${outerIndex}` as ConcatAllInnerId;

        return createInnerObservable(outerIndex).pipe(
          tap({
            subscribe: () => {
              this.patchState({
                activeInner: inner,
                subscribedInners: [...this.state.subscribedInners, inner],
                status: `${inner}$ 被 concatAll 订阅`,
              });
            },
            complete: () => {
              this.patchState({
                activeInner: null,
                completedInners: [...this.state.completedInners, inner],
                status: `${inner}$ 完成，concatAll 才会检查下一个内部 Observable`,
              });
            },
          }),
        );
      }),
      concatAll(),
    );

    this.subscription = ho$.subscribe({
      next: (item) => {
        this.patchState({
          outputs: [...this.state.outputs, { ...item, at: stamp() }],
          status: `输出 ${item.value}，当前来自 ${item.inner}$`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInner: null,
          status: "concatAll 完成：内部 Observable 被按顺序串联输出",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInner: null,
          status: "发生错误，concatAll 演示终止",
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

  private patchState(patch: Partial<ConcatAllDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
