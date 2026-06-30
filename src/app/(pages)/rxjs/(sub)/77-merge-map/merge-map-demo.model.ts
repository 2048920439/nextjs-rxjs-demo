import { BehaviorSubject, concatMap, delay, interval, map, mergeMap, of, type Subscription, take, tap } from "rxjs";

export type MergeMapSourceValue = {
  value: number;
  at: string;
};

export type MergeMapInnerValue = {
  outer: number;
  inner: number;
  label: string;
  at: string;
};

export type MergeMapDemoState = {
  running: boolean;
  status: string;
  sourceValues: MergeMapSourceValue[];
  outputs: MergeMapInnerValue[];
  activeInners: number[];
};

const INITIAL_STATE: MergeMapDemoState = {
  running: false,
  status: "点击运行，观察 mergeMap 如何并发订阅内部 Observable",
  sourceValues: [],
  outputs: [],
  activeInners: [],
};

function createInner$(outer: number) {
  return interval(700).pipe(
    take(3),
    map((inner) => ({
      outer,
      inner,
      label: `${outer}-${inner}`,
    })),
  );
}

export class MergeMapDemoModel {
  private readonly stateSubject = new BehaviorSubject<MergeMapDemoState>(INITIAL_STATE);
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
      status: "source$ 每 500ms 产生一个值；mergeMap 会直接订阅每个内部 Observable，不等待前一个完成",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const result$ = of(0, 1, 2).pipe(
      concatMap((value) => of(value).pipe(delay(value === 0 ? 0 : 500))),
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，mergeMap 立即映射并订阅 inner${value}$`,
        });
      }),
      mergeMap((outer) =>
        createInner$(outer).pipe(
          tap({
            subscribe: () => {
              this.patchState({
                activeInners: [...this.state.activeInners, outer],
                status: `inner${outer}$ 开始；已有内部流不会被等待或取消`,
              });
            },
            complete: () => {
              this.patchState({
                activeInners: this.state.activeInners.filter((item) => item !== outer),
                status: `inner${outer}$ 完成，其他内部流仍可继续输出`,
              });
            },
          }),
        ),
      ),
    );

    this.subscription = result$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { ...value, at: stamp() }],
          status: `mergeMap 输出 ${value.label}，多个内部 Observable 可以交叉产生结果`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeInners: [],
          status: "mergeMap 完成：所有内部 Observable 都已合并输出",
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

  private patchState(patch: Partial<MergeMapDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
