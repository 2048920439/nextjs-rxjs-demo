import { BehaviorSubject, interval, map, Observable, type Subscription, take, tap, zipAll } from "rxjs";

export type ZipAllInnerId = "inner0" | "inner1";

export type ZipAllPair = {
  values: string[];
  at: string;
};

export type ZipAllDemoState = {
  running: boolean;
  status: string;
  outerValues: string[];
  outerCompleted: boolean;
  activeInners: ZipAllInnerId[];
  completedInners: ZipAllInnerId[];
  innerValuesByInner: Record<ZipAllInnerId, string[]>;
  pairs: ZipAllPair[];
};

const INITIAL_STATE: ZipAllDemoState = {
  running: false,
  status: "点击运行，观察 zipAll 如何等待外层完成后再配对",
  outerValues: [],
  outerCompleted: false,
  activeInners: [],
  completedInners: [],
  innerValuesByInner: {
    inner0: [],
    inner1: [],
  },
  pairs: [],
};

function createInnerObservable(outerIndex: number): Observable<{ inner: ZipAllInnerId; value: string }> {
  const inner = `inner${outerIndex}` as ZipAllInnerId;

  return interval(550).pipe(
    take(2),
    map((innerIndex) => ({
      inner,
      value: `${outerIndex}:${innerIndex}`,
    })),
  );
}

export class ZipAllDemoModel {
  private readonly stateSubject = new BehaviorSubject<ZipAllDemoState>(INITIAL_STATE);
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
      status: "ho$ 开始产生内部 Observable；zipAll 先收集，不马上订阅",
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
            status: `${value} 已被 ho$ 产生；zipAll 仍在等待 ho$ complete`,
          });
        },
        complete: () => {
          this.patchState({
            outerCompleted: true,
            status: "ho$ 已完成，zipAll 现在能确定要配对的内部 Observable 数量",
          });
        },
      }),
      map((outerIndex) => {
        const inner = `inner${outerIndex}` as ZipAllInnerId;

        return createInnerObservable(outerIndex).pipe(
          tap({
            subscribe: () => {
              this.patchState({
                activeInners: [...this.state.activeInners, inner],
                status: `${inner}$ 被 zipAll 订阅，开始等待同位置配对`,
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
                status: `${inner}$ 完成；zipAll 继续等待其他内部流`,
              });
            },
          }),
        );
      }),
      zipAll(),
    );

    this.subscription = ho$.subscribe({
      next: (values) => {
        const pair = values.map((item) => item.value);
        this.patchState({
          pairs: [...this.state.pairs, { values: pair, at: stamp() }],
          status: `zipAll 输出一组同位置配对：[${pair.join(", ")}]`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInners: [],
          status: "zipAll 完成：按位置配对的内部值全部输出",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInners: [],
          status: "发生错误，zipAll 演示终止",
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

  private patchState(patch: Partial<ZipAllDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
