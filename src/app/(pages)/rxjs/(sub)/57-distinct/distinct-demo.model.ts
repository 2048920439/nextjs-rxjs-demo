import { BehaviorSubject, distinct, from, map, type Subscription, tap } from "rxjs";

export type DistinctValue = {
  label: string;
  keyValue: string;
  passed: boolean;
};

export type DistinctOutput = {
  label: string;
};

export type DistinctMode = "primitive" | "key-selector";

export type DistinctDemoState = {
  running: boolean;
  mode: DistinctMode;
  status: string;
  sourceValues: DistinctValue[];
  outputs: DistinctOutput[];
};

const INITIAL_STATE: DistinctDemoState = {
  running: false,
  mode: "primitive",
  status: "选择场景运行，观察 distinct 如何只放行从未出现过的 key",
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

export class DistinctDemoModel {
  private readonly stateSubject = new BehaviorSubject<DistinctDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: DistinctMode) {
    this.subscription?.unsubscribe();
    const seen = new Set<string>();

    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: mode === "primitive" ? "distinct() 使用值本身判断是否出现过" : "distinct((x) => x.name) 只用 name 判断对象是否重复",
    });

    const source$ =
      mode === "primitive"
        ? from(PRIMITIVE_VALUES).pipe(
            tap((value) => {
              const keyValue = String(value);
              const passed = !seen.has(keyValue);
              seen.add(keyValue);
              this.patchState({
                sourceValues: [...this.state.sourceValues, { label: String(value), keyValue, passed }],
                status: passed ? `${value} 第一次出现，进入下游` : `${value} 已经出现过，被 distinct 丢弃`,
              });
            }),
            distinct(),
            map((value) => String(value)),
          )
        : from(OBJECT_VALUES).pipe(
            tap((value) => {
              const keyValue = value.name;
              const passed = !seen.has(keyValue);
              seen.add(keyValue);
              this.patchState({
                sourceValues: [...this.state.sourceValues, { label: `${value.name} ${value.version}`, keyValue, passed }],
                status: passed ? `${value.name} 第一次出现，进入下游` : `${value.name} 已经出现过，被 distinct 丢弃`,
              });
            }),
            distinct((value) => value.name),
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
          status: "distinct 完成：全局 seen 集合中的重复 key 都被过滤",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，distinct 演示终止",
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

  private patchState(patch: Partial<DistinctDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
