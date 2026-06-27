import { BehaviorSubject, exhaustAll, interval, map, Observable, type Subscription, take, tap } from "rxjs";

export type ExhaustInnerId = "inner0" | "inner1" | "inner2";

export type ExhaustOutput = {
  inner: ExhaustInnerId;
  value: string;
  at: string;
};

export type ExhaustDemoState = {
  running: boolean;
  status: string;
  outerValues: string[];
  activeInner: ExhaustInnerId | null;
  ignoredInners: ExhaustInnerId[];
  completedInners: ExhaustInnerId[];
  outputsByInner: Record<ExhaustInnerId, string[]>;
  outputs: ExhaustOutput[];
};

const EMPTY_OUTPUTS: Record<ExhaustInnerId, string[]> = {
  inner0: [],
  inner1: [],
  inner2: [],
};

const INITIAL_STATE: ExhaustDemoState = {
  running: false,
  status: "点击运行，观察 exhaust 如何忽略重叠的内部 Observable",
  outerValues: [],
  activeInner: null,
  ignoredInners: [],
  completedInners: [],
  outputsByInner: EMPTY_OUTPUTS,
  outputs: [],
};

function createInnerObservable(outerIndex: number): Observable<{ inner: ExhaustInnerId; value: string }> {
  const inner = `inner${outerIndex}` as ExhaustInnerId;

  return interval(700).pipe(
    take(2),
    map((innerIndex) => ({
      inner,
      value: `${outerIndex}:${innerIndex}`,
    })),
  );
}

export class ExhaustDemoModel {
  private readonly stateSubject = new BehaviorSubject<ExhaustDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.stateSubject.next({
      ...INITIAL_STATE,
      outputsByInner: { ...EMPTY_OUTPUTS },
      running: true,
      status: "ho$ 开始产生内部 Observable，exhaust 会先耗尽当前内部流",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const ho$ = interval(1000).pipe(
      take(3),
      tap((outerIndex) => {
        const nextInner = `inner${outerIndex}` as ExhaustInnerId;
        const isIgnored = this.state.activeInner !== null;

        this.patchState({
          outerValues: [...this.state.outerValues, `${nextInner}$`],
          ignoredInners: isIgnored ? [...this.state.ignoredInners, nextInner] : this.state.ignoredInners,
          status: isIgnored ? `${nextInner}$ 出现时 ${this.state.activeInner}$ 还没完成，exhaust 忽略它` : `${nextInner}$ 出现，exhaust 开始订阅它`,
        });
      }),
      map((outerIndex) => {
        const inner = `inner${outerIndex}` as ExhaustInnerId;

        return createInnerObservable(outerIndex).pipe(
          tap({
            subscribe: () => {
              this.patchState({
                activeInner: inner,
                status: `${inner}$ 已被订阅`,
              });
            },
            complete: () => {
              this.patchState({
                activeInner: null,
                completedInners: [...this.state.completedInners, inner],
                status: `${inner}$ 完成，exhaust 可以接受后续内部流`,
              });
            },
          }),
        );
      }),
      exhaustAll(),
    );

    this.subscription = ho$.subscribe({
      next: (item) => {
        this.patchState({
          outputsByInner: {
            ...this.state.outputsByInner,
            [item.inner]: [...this.state.outputsByInner[item.inner], item.value],
          },
          outputs: [...this.state.outputs, { ...item, at: stamp() }],
          status: `exhaust 输出 ${item.value}，当前耗尽 ${item.inner}$`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInner: null,
          status: "exhaust 完成：ho$ 已完成，并且当前内部 Observable 也已完成",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInner: null,
          status: "发生错误，exhaust 演示终止",
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

  private patchState(patch: Partial<ExhaustDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
