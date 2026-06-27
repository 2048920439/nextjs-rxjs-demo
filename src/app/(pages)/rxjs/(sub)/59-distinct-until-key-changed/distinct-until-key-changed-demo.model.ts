import { BehaviorSubject, distinctUntilKeyChanged, from, type Subscription, tap } from "rxjs";

export type DistinctUntilKeyChangedValue = {
  label: string;
  keyValue: string;
  passed: boolean;
};

export type DistinctUntilKeyChangedOutput = {
  label: string;
};

export type DistinctUntilKeyChangedDemoState = {
  running: boolean;
  status: string;
  sourceValues: DistinctUntilKeyChangedValue[];
  outputs: DistinctUntilKeyChangedOutput[];
};

const INITIAL_STATE: DistinctUntilKeyChangedDemoState = {
  running: false,
  status: "点击运行，观察 distinctUntilKeyChanged 如何按字段过滤连续重复对象",
  sourceValues: [],
  outputs: [],
};

const SOURCE_VALUES = [
  { name: "RxJS", version: "v4" },
  { name: "React", version: "v15" },
  { name: "React", version: "v16" },
  { name: "RxJS", version: "v5" },
];

export class DistinctUntilKeyChangedDemoModel {
  private readonly stateSubject = new BehaviorSubject<DistinctUntilKeyChangedDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    let previousName: string | null = null;

    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      status: "distinctUntilKeyChanged('name') 只比较相邻对象的 name 字段",
    });

    const source$ = from(SOURCE_VALUES).pipe(
      tap((value) => {
        const passed = value.name !== previousName;
        previousName = value.name;

        this.patchState({
          sourceValues: [
            ...this.state.sourceValues,
            {
              label: `${value.name} ${value.version}`,
              keyValue: value.name,
              passed,
            },
          ],
          status: passed ? `${value.name} 与上一个 name 不同，进入下游` : `${value.name} 连续重复，被过滤`,
        });
      }),
      distinctUntilKeyChanged("name"),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { label: `${value.name} ${value.version}` }],
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "distinctUntilKeyChanged 完成：它是按单个 key 的连续去重简写",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，distinctUntilKeyChanged 演示终止",
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

  private patchState(patch: Partial<DistinctUntilKeyChangedDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
