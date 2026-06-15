import { BehaviorSubject, combineAll, interval, map, Observable, type Subscription, take, tap } from "rxjs";

export type CombineAllInnerId = "inner0" | "inner1";

export type CombineAllSnapshot = {
  values: string[];
  at: string;
};

export type CombineAllDemoState = {
  running: boolean;
  status: string;
  outerValues: string[];
  outerCompleted: boolean;
  activeInners: CombineAllInnerId[];
  completedInners: CombineAllInnerId[];
  innerValuesByInner: Record<CombineAllInnerId, string[]>;
  snapshots: CombineAllSnapshot[];
};

const INITIAL_STATE: CombineAllDemoState = {
  running: false,
  status: "点击运行，观察 combineAll 如何组合内部流的最新值",
  outerValues: [],
  outerCompleted: false,
  activeInners: [],
  completedInners: [],
  innerValuesByInner: {
    inner0: [],
    inner1: [],
  },
  snapshots: [],
};

function createInnerObservable(outerIndex: number): Observable<{ inner: CombineAllInnerId; value: string }> {
  const inner = `inner${outerIndex}` as CombineAllInnerId;

  return interval(550).pipe(
    take(2),
    map((innerIndex) => ({
      inner,
      value: `${outerIndex}:${innerIndex}`,
    })),
  );
}

export class CombineAllDemoModel {
  private readonly stateSubject = new BehaviorSubject<CombineAllDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      innerValuesByInner: {
        inner0: [],
        inner1: [],
      },
      running: true,
      status: "ho$ 开始产生内部 Observable；combineAll 先收集输入集合",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const ho$ = interval(500).pipe(
      take(2),
      tap({
        next: (outerIndex) => {
          const value = `inner${outerIndex}$`;
          this.patchState({
            outerValues: [...this.state.outerValues, value],
            status: `${value} 已被 ho$ 产生；combineAll 仍在等待 ho$ complete`,
          });
        },
        complete: () => {
          this.patchState({
            outerCompleted: true,
            status: "ho$ 已完成，combineAll 现在开始订阅内部 Observable",
          });
        },
      }),
      map((outerIndex) => {
        const inner = `inner${outerIndex}` as CombineAllInnerId;

        return createInnerObservable(outerIndex).pipe(
          tap({
            subscribe: () => {
              this.patchState({
                activeInners: [...this.state.activeInners, inner],
                status: `${inner}$ 被 combineAll 订阅，等待每个内部流至少一个值`,
              });
            },
            next: (item) => {
              this.patchState({
                innerValuesByInner: {
                  ...this.state.innerValuesByInner,
                  [inner]: [...this.state.innerValuesByInner[inner], item.value],
                },
              });
            },
            complete: () => {
              this.patchState({
                activeInners: this.state.activeInners.filter((item) => item !== inner),
                completedInners: [...this.state.completedInners, inner],
                status: `${inner}$ 完成；combineAll 会继续使用它的最后一个值`,
              });
            },
          }),
        );
      }),
      combineAll(),
    );

    this.subscription = ho$.subscribe({
      next: (values) => {
        const snapshot = values.map((item) => item.value);
        this.patchState({
          snapshots: [...this.state.snapshots, { values: snapshot, at: stamp() }],
          status: `combineAll 输出最新组合：[${snapshot.join(", ")}]`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInners: [],
          status: "combineAll 完成：所有内部 Observable 都已结束",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInners: [],
          status: "发生错误，combineAll 演示终止",
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

  private patchState(patch: Partial<CombineAllDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
