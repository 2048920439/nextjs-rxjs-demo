import { BehaviorSubject, interval, map, mergeAll, Observable, type Subscription, take, tap } from "rxjs";

export type MergeAllInnerId = "inner0" | "inner1";

export type MergeAllOutput = {
  inner: MergeAllInnerId;
  value: string;
  at: string;
};

export type MergeAllDemoState = {
  running: boolean;
  status: string;
  outerValues: string[];
  activeInners: MergeAllInnerId[];
  completedInners: MergeAllInnerId[];
  outputsByInner: Record<MergeAllInnerId, string[]>;
  outputs: MergeAllOutput[];
};

const INITIAL_STATE: MergeAllDemoState = {
  running: false,
  status: "点击运行，观察 mergeAll 如何立刻订阅内部 Observable",
  outerValues: [],
  activeInners: [],
  completedInners: [],
  outputsByInner: {
    inner0: [],
    inner1: [],
  },
  outputs: [],
};

function createInnerObservable(outerIndex: number): Observable<{ inner: MergeAllInnerId; value: string }> {
  const inner = `inner${outerIndex}` as MergeAllInnerId;

  return interval(650).pipe(
    take(2),
    map((innerIndex) => ({
      inner,
      value: `${outerIndex}:${innerIndex}`,
    })),
  );
}

export class MergeAllDemoModel {
  private readonly stateSubject = new BehaviorSubject<MergeAllDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      outputsByInner: {
        inner0: [],
        inner1: [],
      },
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
          status: `${value} 已产生，mergeAll 会马上尝试订阅它`,
        });
      }),
      map((outerIndex) => {
        const inner = `inner${outerIndex}` as MergeAllInnerId;

        return createInnerObservable(outerIndex).pipe(
          tap({
            subscribe: () => {
              this.patchState({
                activeInners: [...this.state.activeInners, inner],
                status: `${inner}$ 被 mergeAll 立即订阅`,
              });
            },
            complete: () => {
              this.patchState({
                activeInners: this.state.activeInners.filter((item) => item !== inner),
                completedInners: [...this.state.completedInners, inner],
                status: `${inner}$ 完成，其他内部流不受影响`,
              });
            },
          }),
        );
      }),
      mergeAll(),
    );

    this.subscription = ho$.subscribe({
      next: (item) => {
        this.patchState({
          outputsByInner: {
            ...this.state.outputsByInner,
            [item.inner]: [...this.state.outputsByInner[item.inner], item.value],
          },
          outputs: [...this.state.outputs, { ...item, at: stamp() }],
          status: `输出 ${item.value}，mergeAll 按真实到达时间转发`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInners: [],
          status: "mergeAll 完成：外层和所有内部 Observable 都结束",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInners: [],
          status: "发生错误，mergeAll 演示终止",
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

  private patchState(patch: Partial<MergeAllDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
