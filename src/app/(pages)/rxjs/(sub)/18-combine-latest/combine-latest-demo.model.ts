import { BehaviorSubject, combineLatest, interval, map, type Subscription, take, tap } from "rxjs";

export type CombineLatestSnapshot = {
  temperature: number;
  wind: string;
};

export type CombineLatestDemoState = {
  running: boolean;
  status: string;
  temperatureValues: number[];
  windValues: string[];
  snapshots: CombineLatestSnapshot[];
};

const INITIAL_STATE: CombineLatestDemoState = {
  running: false,
  status: "点击运行，观察 combineLatest 的最新快照",
  temperatureValues: [],
  windValues: [],
  snapshots: [],
};

export class CombineLatestDemoModel {
  private readonly stateSubject = new BehaviorSubject<CombineLatestDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.patchState({
      running: true,
      status: "等待两个来源都先发出第一条数据",
      temperatureValues: [],
      windValues: [],
      snapshots: [],
    });

    const temperature$ = interval(700).pipe(
      take(5),
      map((index) => 24 + index),
      tap((value) => {
        this.patchState({ temperatureValues: [...this.state.temperatureValues, value] });
      }),
    );

    const wind$ = interval(1500).pipe(
      take(3),
      map((index) => ["东北风", "东风", "东南风"][index] ?? "东风"),
      tap((value) => {
        this.patchState({ windValues: [...this.state.windValues, value] });
      }),
    );

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    this.subscription = combineLatest([temperature$, wind$]).subscribe({
      next: ([temperature, wind]) => {
        this.patchState({
          snapshots: [...this.state.snapshots, { temperature, wind }],
          status: `最新快照：${temperature}C / ${wind}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: `combineLatest 完成：两边都结束后收工（${stamp()}）`,
        });
      },
      error: (error) => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: `发生错误：${String(error)}`,
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

  private patchState(patch: Partial<CombineLatestDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
