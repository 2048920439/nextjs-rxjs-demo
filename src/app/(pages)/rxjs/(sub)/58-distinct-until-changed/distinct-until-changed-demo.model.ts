import { BehaviorSubject, distinctUntilChanged, from, map, type Subscription, tap } from "rxjs";

export type DistinctUntilChangedValue = {
  label: string;
  passed: boolean;
};

export type DistinctUntilChangedOutput = {
  label: string;
};

export type DistinctUntilChangedMode = "primitive" | "compare";

export type DistinctUntilChangedDemoState = {
  running: boolean;
  mode: DistinctUntilChangedMode;
  status: string;
  sourceValues: DistinctUntilChangedValue[];
  outputs: DistinctUntilChangedOutput[];
};

const INITIAL_STATE: DistinctUntilChangedDemoState = {
  running: false,
  mode: "primitive",
  status: "选择场景运行，观察 distinctUntilChanged 只比较上一个值",
  sourceValues: [],
  outputs: [],
};

const PRIMITIVE_VALUES = [0, 1, 1, 2, 0, 0, 1, 3, 3];
const OBJECT_VALUES = [
  { name: "RxJS", version: "v4" },
  { name: "React", version: "v15" },
  { name: "React", version: "v16" },
  { name: "RxJS", version: "v5" },
];

export class DistinctUntilChangedDemoModel {
  private readonly stateSubject = new BehaviorSubject<DistinctUntilChangedDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: DistinctUntilChangedMode) {
    this.subscription?.unsubscribe();
    let previousKey: string | null = null;

    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: mode === "primitive" ? "distinctUntilChanged() 会丢弃连续重复值" : "compare 只比较相邻两个对象的 name",
    });

    const source$ =
      mode === "primitive"
        ? from(PRIMITIVE_VALUES).pipe(
            tap((value) => {
              const key = String(value);
              const passed = key !== previousKey;
              previousKey = key;
              this.patchState({
                sourceValues: [...this.state.sourceValues, { label: key, passed }],
                status: passed ? `${key} 与上一个值不同，进入下游` : `${key} 与上一个值相同，被丢弃`,
              });
            }),
            distinctUntilChanged(),
            map((value) => String(value)),
          )
        : from(OBJECT_VALUES).pipe(
            tap((value) => {
              const key = value.name;
              const passed = key !== previousKey;
              previousKey = key;
              this.patchState({
                sourceValues: [...this.state.sourceValues, { label: `${value.name} ${value.version}`, passed }],
                status: passed ? `${value.name} 与上一个 name 不同，进入下游` : `${value.name} 连续重复，被丢弃`,
              });
            }),
            distinctUntilChanged((prev, curr) => prev.name === curr.name),
            map((value) => `${value.name} ${value.version}`),
          );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { label: value }],
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "distinctUntilChanged 完成：只有连续重复值被过滤",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，distinctUntilChanged 演示终止",
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

  private patchState(patch: Partial<DistinctUntilChangedDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
