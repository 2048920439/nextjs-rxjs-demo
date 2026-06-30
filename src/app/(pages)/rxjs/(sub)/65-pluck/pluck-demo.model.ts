import { BehaviorSubject, concat, delay, of, pluck, type Subscription, tap } from "rxjs";

export type PluckMode = "name" | "nested" | "missing";

export type PluckSourceValue = {
  label: string;
  at: string;
};

export type PluckOutput = {
  label: string;
  at: string;
};

export type PluckDemoState = {
  running: boolean;
  mode: PluckMode;
  status: string;
  operatorLabel: string;
  sourceValues: PluckSourceValue[];
  outputs: PluckOutput[];
};

type LibraryItem = {
  name: string;
  version: string;
};

type ClickLikeEvent = {
  type: string;
  target?: {
    tagName?: string;
  };
};

const INITIAL_STATE: PluckDemoState = {
  running: false,
  mode: "name",
  status: "选择一个场景，观察 pluck 如何从对象中提取字段",
  operatorLabel: 'source$.pipe(pluck("name"))',
  sourceValues: [],
  outputs: [],
};

const LIBRARY_VALUES: LibraryItem[] = [
  { name: "RxJS", version: "v4" },
  { name: "React", version: "v15" },
  { name: "React", version: "v16" },
  { name: "RxJS", version: "v5" },
];

const EVENT_VALUES: ClickLikeEvent[] = [
  { type: "click", target: { tagName: "BUTTON" } },
  { type: "click", target: { tagName: "A" } },
  { type: "click", target: { tagName: "INPUT" } },
];

function labelValue(value: unknown) {
  return value === undefined ? "undefined" : String(value);
}

export class PluckDemoModel {
  private readonly stateSubject = new BehaviorSubject<PluckDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: PluckMode) {
    this.subscription?.unsubscribe();

    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      operatorLabel: this.getOperatorLabel(mode),
      status: this.getStartStatus(mode),
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const result$ =
      mode === "nested"
        ? concat(...EVENT_VALUES.map((value) => of(value).pipe(delay(350)))).pipe(
            tap((value) => {
              this.patchState({
                sourceValues: [...this.state.sourceValues, { label: `${value.type}:${value.target?.tagName ?? "none"}`, at: stamp() }],
                status: `读取 event.target.tagName，当前事件目标是 ${value.target?.tagName ?? "undefined"}`,
              });
            }),
            pluck("target", "tagName"),
          )
        : concat(...LIBRARY_VALUES.map((value) => of(value).pipe(delay(350)))).pipe(
            tap((value) => {
              this.patchState({
                sourceValues: [...this.state.sourceValues, { label: `${value.name} ${value.version}`, at: stamp() }],
                status:
                  mode === "name"
                    ? `从 ${value.name} ${value.version} 中提取 name`
                    : `${value.name} ${value.version} 没有 nosuchfield.foo，pluck 会输出 undefined`,
              });
            }),
            mode === "name" ? pluck("name") : pluck("nosuchfield", "foo"),
          );

    this.subscription = result$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { label: labelValue(value), at: stamp() }],
          status: `pluck 输出 ${labelValue(value)}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "pluck 完成：每个上游对象都被映射成指定字段的值",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，pluck 演示终止",
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

  private getOperatorLabel(mode: PluckMode) {
    if (mode === "nested") {
      return 'source$.pipe(pluck("target", "tagName"))';
    }

    if (mode === "missing") {
      return 'source$.pipe(pluck("nosuchfield", "foo"))';
    }

    return 'source$.pipe(pluck("name"))';
  }

  private getStartStatus(mode: PluckMode) {
    if (mode === "nested") {
      return "多个参数会按路径逐层提取嵌套字段";
    }

    if (mode === "missing") {
      return "字段路径不存在时，pluck 输出 undefined 而不是抛错";
    }

    return "pluck('name') 会取出每个对象的 name 字段";
  }

  private patchState(patch: Partial<PluckDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
