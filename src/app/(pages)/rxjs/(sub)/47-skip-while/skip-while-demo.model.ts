import { BehaviorSubject, interval, map, skipWhile, type Subscription, take, tap } from "rxjs";

export type SkipWhileValue = {
  value: number;
  skipped: boolean;
  at: string;
};

export type SkipWhileOutput = {
  value: number;
  at: string;
};

export type SkipWhileDemoState = {
  running: boolean;
  status: string;
  sourceValues: SkipWhileValue[];
  outputs: SkipWhileOutput[];
};

const INITIAL_STATE: SkipWhileDemoState = {
  running: false,
  status: "点击运行，观察 skipWhile 只跳过开头连续满足条件的值",
  sourceValues: [],
  outputs: [],
};

export class SkipWhileDemoModel {
  private readonly stateSubject = new BehaviorSubject<SkipWhileDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;
  private gateOpened = false;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  run() {
    this.subscription?.unsubscribe();
    this.gateOpened = false;
    this.stateSubject.next({
      ...INITIAL_STATE,
      running: true,
      status: "source$ 发出 0 到 5，skipWhile(value % 2 === 0) 先跳过开头偶数",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const source$ = interval(450).pipe(
      take(6),
      map((value) => value),
      tap((value) => {
        const wasOpen = this.gateOpened;
        const skipped = !wasOpen && value % 2 === 0;
        if (!skipped) this.gateOpened = true;

        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, skipped, at: stamp() }],
          status: skipped
            ? `${value} 是开头连续偶数，被 skipWhile 跳过`
            : wasOpen
              ? `${value} 出现在跳过阶段之后，照常转发`
              : `${value} 第一次让 predicate 返回 false，skipWhile 打开通道`,
        });
      }),
      skipWhile((value) => value % 2 === 0),
    );

    this.subscription = source$.subscribe({
      next: (value) => {
        this.patchState({
          outputs: [...this.state.outputs, { value, at: stamp() }],
          status: `skipWhile 转发 ${value}`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "skipWhile 完成：只跳过了最前面的偶数，后面的偶数也会进入下游",
        });
      },
      error: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          status: "发生错误，skipWhile 演示终止",
        });
      },
    });
  }

  reset() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.gateOpened = false;
    this.stateSubject.next(INITIAL_STATE);
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private patchState(patch: Partial<SkipWhileDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
