import { BehaviorSubject, interval, map, Observable, type Subscription, switchAll, take, tap } from "rxjs";

export type SwitchInnerId = "inner0" | "inner1" | "inner2";

export type SwitchOutput = {
  inner: SwitchInnerId;
  value: string;
  at: string;
};

export type SwitchDemoState = {
  running: boolean;
  status: string;
  outerValues: string[];
  activeInner: SwitchInnerId | null;
  cancelledInners: SwitchInnerId[];
  completedInners: SwitchInnerId[];
  outputsByInner: Record<SwitchInnerId, string[]>;
  outputs: SwitchOutput[];
};

const EMPTY_OUTPUTS: Record<SwitchInnerId, string[]> = {
  inner0: [],
  inner1: [],
  inner2: [],
};

const INITIAL_STATE: SwitchDemoState = {
  running: false,
  status: "点击运行，观察 switch 如何切换到最新内部 Observable",
  outerValues: [],
  activeInner: null,
  cancelledInners: [],
  completedInners: [],
  outputsByInner: EMPTY_OUTPUTS,
  outputs: [],
};

function createInnerObservable(outerIndex: number): Observable<{ inner: SwitchInnerId; value: string }> {
  const inner = `inner${outerIndex}` as SwitchInnerId;

  return interval(700).pipe(
    take(2),
    map((innerIndex) => ({
      inner,
      value: `${outerIndex}:${innerIndex}`,
    })),
  );
}

export class SwitchDemoModel {
  private readonly stateSubject = new BehaviorSubject<SwitchDemoState>(INITIAL_STATE);
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
      status: "ho$ 开始产生内部 Observable，switch 会始终跟随最新一个",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const ho$ = interval(1000).pipe(
      take(3),
      tap((outerIndex) => {
        const nextInner = `inner${outerIndex}` as SwitchInnerId;
        const previousInner = this.state.activeInner;
        const cancelledInners =
          previousInner && !this.state.completedInners.includes(previousInner) ? [...this.state.cancelledInners, previousInner] : this.state.cancelledInners;

        this.patchState({
          outerValues: [...this.state.outerValues, `${nextInner}$`],
          cancelledInners,
          status: previousInner ? `${nextInner}$ 出现，switch 取消 ${previousInner}$ 并切换过去` : `${nextInner}$ 出现，switch 开始订阅它`,
        });
      }),
      map((outerIndex) => {
        const inner = `inner${outerIndex}` as SwitchInnerId;

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
                status: `${inner}$ 完成`,
              });
            },
          }),
        );
      }),
      switchAll(),
    );

    this.subscription = ho$.subscribe({
      next: (item) => {
        this.patchState({
          outputsByInner: {
            ...this.state.outputsByInner,
            [item.inner]: [...this.state.outputsByInner[item.inner], item.value],
          },
          outputs: [...this.state.outputs, { ...item, at: stamp() }],
          status: `switch 输出 ${item.value}，当前跟随 ${item.inner}$`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInner: null,
          status: "switch 完成：ho$ 已完成，并且最新内部 Observable 也已完成",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInner: null,
          status: "发生错误，switch 演示终止",
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

  private patchState(patch: Partial<SwitchDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
