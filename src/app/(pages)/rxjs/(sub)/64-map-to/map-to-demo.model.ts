import { BehaviorSubject, concat, delay, map, mapTo, of, type Subscription, tap } from "rxjs";

export type MapToMode = "map-to" | "map";

export type MapToSourceValue = {
  value: number;
  at: string;
};

export type MapToOutput = {
  value: string;
  at: string;
};

export type MapToDemoState = {
  running: boolean;
  mode: MapToMode;
  status: string;
  sourceValues: MapToSourceValue[];
  outputs: MapToOutput[];
};

const INITIAL_STATE: MapToDemoState = {
  running: false,
  mode: "map-to",
  status: "选择一个场景，观察 mapTo 如何忽略上游值并输出固定值",
  sourceValues: [],
  outputs: [],
};

const VALUES = [3, 1, 4];
const FIXED_VALUE = "A";

export class MapToDemoModel {
  private readonly stateSubject = new BehaviorSubject<MapToDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: MapToMode) {
    this.subscription?.unsubscribe();

    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: mode === "map-to" ? "mapTo('A') 会把所有上游 next 都替换成同一个常量" : "map(() => 'A') 与 mapTo('A') 的输出等价，也是 RxJS 7 更推荐的写法",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = concat(...VALUES.map((value) => of(value).pipe(delay(350)))).pipe(
      tap((value) => {
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          status: `source$ 发出 ${value}，下游会收到固定值 ${FIXED_VALUE}`,
        });
      }),
    );

    const result$ = mode === "map-to" ? source$.pipe(mapTo(FIXED_VALUE)) : source$.pipe(map(() => FIXED_VALUE));

    this.subscription = result$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `忽略上游原值，输出 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "mapTo 完成：上游发出几次 next，下游就收到几次固定值",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，mapTo 演示终止",
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

  private patchState(patch: Partial<MapToDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
