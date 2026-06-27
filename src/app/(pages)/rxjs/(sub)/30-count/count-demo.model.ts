import { BehaviorSubject, concat, count, interval, map, of, type Subscription, take, tap } from "rxjs";

export type CountSourceValue = {
  value: number;
  phase: "sync" | "async";
  at: string;
};

export type CountResult = {
  value: number;
  at: string;
};

export type CountDemoState = {
  running: boolean;
  status: string;
  sourceValues: CountSourceValue[];
  result: CountResult | null;
};

const INITIAL_STATE: CountDemoState = {
  running: false,
  status: "点击运行，观察 count 如何等上游 complete 后再输出总数",
  sourceValues: [],
  result: null,
};

export class CountDemoModel {
  private readonly stateSubject = new BehaviorSubject<CountDemoState>(INITIAL_STATE);
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
      status: "source$ 开始发值，count 暂时不会输出",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = concat(
      of(1, 2, 3).pipe(map((value) => ({ value, phase: "sync" as const }))),
      interval(500).pipe(
        take(3),
        map((index) => ({ value: index + 4, phase: "async" as const })),
      ),
    ).pipe(
      tap((item) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { ...item, at: stamp() }],
          status: `source$ 发出 ${item.value}，count 仍在累计数量`,
        });
      }),
      count(),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          result: { value, at: stamp() },
          status: `source$ 已 complete，count 输出唯一结果 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "count 完成：只输出一次总数量，然后 complete",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，count 演示终止",
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

  private patchState(patch: Partial<CountDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
