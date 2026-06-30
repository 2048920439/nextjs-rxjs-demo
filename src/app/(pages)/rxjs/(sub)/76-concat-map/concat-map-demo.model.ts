import { BehaviorSubject, concatMap, delay, interval, map, of, type Subscription, take, tap } from "rxjs";

export type ConcatMapSourceValue = {
  value: number;
  at: string;
};

export type ConcatMapInnerValue = {
  outer: number;
  inner: number;
  label: string;
  at: string;
};

export type ConcatMapDemoState = {
  running: boolean;
  status: string;
  sourceValues: ConcatMapSourceValue[];
  outputs: ConcatMapInnerValue[];
  activeOuter: number | null;
};

const INITIAL_STATE: ConcatMapDemoState = {
  running: false,
  status: "点击运行，观察 concatMap 如何按顺序订阅内部 Observable",
  sourceValues: [],
  outputs: [],
  activeOuter: null,
};

function createInner$(outer: number) {
  return interval(1000).pipe(
    take(3),
    map((inner) => ({
      outer,
      inner,
      label: `${outer}-${inner}`,
    })),
  );
}

export class ConcatMapDemoModel {
  private readonly stateSubject = new BehaviorSubject<ConcatMapDemoState>(INITIAL_STATE);
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
      status: "source$ 每 1000ms 产生一个值；每个值会映射成需要 3000ms 完成的内部 Observable",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const result$ = of(0, 1, 2).pipe(
      concatMap((value) => of(value).pipe(delay(value === 0 ? 0 : 1000))),
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，concatMap 会把它排队映射成 inner${value}$`,
        });
      }),
      concatMap((outer) =>
        createInner$(outer).pipe(
          tap({
            subscribe: () => {
              this.patchState({
                activeOuter: outer,
                status: `开始订阅 inner${outer}$；后续内部流必须等待它 complete`,
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
          status: `concatMap 输出 ${value.label}，仍在处理 inner${value.outer}$`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeOuter: null,
          status: "concatMap 完成：内部 Observable 逐个串联，没有交叉输出",
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

  private patchState(patch: Partial<ConcatMapDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
