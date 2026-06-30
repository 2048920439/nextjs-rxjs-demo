import { BehaviorSubject, concat, delay, map, of, type Subscription, tap } from "rxjs";

export type MapMode = "this-arg" | "closure";

export type MapSourceValue = {
  value: number;
  index: number;
  at: string;
};

export type MapOutput = {
  value: string;
  at: string;
};

export type MapDemoState = {
  running: boolean;
  mode: MapMode;
  status: string;
  sourceValues: MapSourceValue[];
  outputs: MapOutput[];
};

const INITIAL_STATE: MapDemoState = {
  running: false,
  mode: "this-arg",
  status: "选择一个场景，观察 map 如何把每个上游值投影成新值",
  sourceValues: [],
  outputs: [],
};

const VALUES = [3, 1, 4];
const CONTEXT = { separator: ":" };

function mapWithThisArg(this: typeof CONTEXT, value: number, index: number) {
  return `${value} ${this.separator} ${index}`;
}

function createClosureProject(separator: string) {
  return (value: number, index: number) => `${value} ${separator} ${index}`;
}

export class MapDemoModel {
  private readonly stateSubject = new BehaviorSubject<MapDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: MapMode) {
    this.subscription?.unsubscribe();

    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: mode === "this-arg" ? "map(project, context) 会把 context 作为普通函数里的 this" : "闭包写法把 separator 固定在函数作用域里，投影函数不依赖 this",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let sourceIndex = 0;

    const source$ = concat(...VALUES.map((value) => of(value).pipe(delay(350)))).pipe(
      tap((value) => {
        const index = sourceIndex;
        sourceIndex += 1;

        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, index, at: stamp() }],
          status: `source$ 发出 ${value}，map 将同时拿到 value=${value} 和 index=${index}`,
        });
      }),
    );

    const result$ = mode === "this-arg" ? source$.pipe(map(mapWithThisArg, CONTEXT)) : source$.pipe(map(createClosureProject(CONTEXT.separator)));

    this.subscription = result$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `map 输出 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "map 完成：每个上游 next 都被一对一投影成一个下游 next",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，map 演示终止",
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

  private patchState(patch: Partial<MapDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
