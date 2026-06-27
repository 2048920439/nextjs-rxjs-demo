import { BehaviorSubject, concat, delay, forkJoin, max, min, of, share, type Subscription, tap } from "rxjs";

export type FrameworkRelease = {
  name: string;
  year: number;
};

export type TimedFrameworkRelease = FrameworkRelease & {
  at: string;
};

export type MaxMinResult = {
  earliest: FrameworkRelease;
  latest: FrameworkRelease;
  at: string;
};

export type MaxMinDemoState = {
  running: boolean;
  status: string;
  sourceValues: TimedFrameworkRelease[];
  result: MaxMinResult | null;
};

const FRAMEWORKS: FrameworkRelease[] = [
  { name: "RxJS", year: 2011 },
  { name: "React", year: 2013 },
  { name: "Redux", year: 2015 },
];

const INITIAL_STATE: MaxMinDemoState = {
  running: false,
  status: "点击运行，观察 max/min 如何在对象流完成后比较 year 字段",
  sourceValues: [],
  result: null,
};

const compareByYear = (a: FrameworkRelease, b: FrameworkRelease) => a.year - b.year;

export class MaxMinDemoModel {
  private readonly stateSubject = new BehaviorSubject<MaxMinDemoState>(INITIAL_STATE);
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
      status: "source$ 开始发出框架对象，min/max 正在等待完整数据集",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = concat(...FRAMEWORKS.map((framework) => of(framework).pipe(delay(450)))).pipe(
      tap((framework) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { ...framework, at: stamp() }],
          status: `${framework.name}(${framework.year}) 已发出，max/min 继续等待 source$ complete`,
        });
      }),
      share(),
    );

    this.subscription = forkJoin({
      earliest: source$.pipe(min(compareByYear)),
      latest: source$.pipe(max(compareByYear)),
    }).subscribe({
      next: ({ earliest, latest }) => {
        this.patchState({
          result: { earliest, latest, at: stamp() },
          status: `source$ 已 complete：min 得到 ${earliest.name}，max 得到 ${latest.name}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({ running: false });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，max/min 演示终止",
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

  private patchState(patch: Partial<MaxMinDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
