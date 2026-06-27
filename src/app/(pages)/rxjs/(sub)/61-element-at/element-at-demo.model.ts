import { BehaviorSubject, concat, delay, elementAt, of, type Subscription, tap } from "rxjs";

export type ElementAtMode = "hit" | "default";

export type ElementAtSourceValue = {
  value: number;
  selected: boolean;
  at: string;
};

export type ElementAtOutput = {
  value: number | null;
  source: "source" | "default";
  at: string;
};

export type ElementAtDemoState = {
  running: boolean;
  mode: ElementAtMode;
  status: string;
  sourceValues: ElementAtSourceValue[];
  output: ElementAtOutput | null;
};

const INITIAL_STATE: ElementAtDemoState = {
  running: false,
  mode: "default",
  status: "选择一个场景，观察 elementAt 如何按下标取值",
  sourceValues: [],
  output: null,
};

const VALUES = [3, 1, 2];

export class ElementAtDemoModel {
  private readonly stateSubject = new BehaviorSubject<ElementAtDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run(mode: ElementAtMode) {
    this.subscription?.unsubscribe();
    const targetIndex = mode === "hit" ? 1 : 3;

    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      mode,
      status: mode === "hit" ? "elementAt(1) 会取第二个 source$ 值" : "elementAt(3, null) 找不到第四个值，会输出默认值 null",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;
    let index = 0;

    const result$ = concat(...VALUES.map((value) => of(value).pipe(delay(350)))).pipe(
      tap((value) => {
        const current = index;
        index += 1;
        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, selected: current === targetIndex, at: stamp() }],
          status: current === targetIndex ? `${value} 的下标是 ${targetIndex}，elementAt 会输出它` : `${value} 的下标不是 ${targetIndex}，继续等待`,
        });
      }),
      mode === "hit" ? elementAt(targetIndex) : elementAt(targetIndex, null),
    );

    this.subscription = result$.subscribe({
      next: (value) => {
        this.patchState({
          output: {
            value,
            source: value === null ? "default" : "source",
            at: stamp(),
          },
          status: value === null ? "source$ complete 后仍没有下标 3，elementAt 输出默认值 null" : `elementAt 输出下标 ${targetIndex} 的值 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "elementAt 完成：输出目标值或默认值后 complete",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "没有默认值且下标不存在时，elementAt 会 error",
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

  private patchState(patch: Partial<ElementAtDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
