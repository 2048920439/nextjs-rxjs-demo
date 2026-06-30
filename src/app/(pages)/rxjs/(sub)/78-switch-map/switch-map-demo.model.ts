import { BehaviorSubject, concatMap, delay, of, type Subscription, switchMap, tap } from "rxjs";

export type SwitchMapSourceValue = {
  value: number;
  at: string;
};

export type SwitchMapRequest = {
  id: number;
  at: string;
};

export type SwitchMapResult = {
  id: number;
  stars: number;
  at: string;
};

export type SwitchMapDemoState = {
  running: boolean;
  status: string;
  sourceValues: SwitchMapSourceValue[];
  requests: SwitchMapRequest[];
  cancelledRequests: number[];
  outputs: SwitchMapResult[];
  activeRequest: number | null;
};

const INITIAL_STATE: SwitchMapDemoState = {
  running: false,
  status: "点击运行，观察 switchMap 如何只保留最新一次请求",
  sourceValues: [],
  requests: [],
  cancelledRequests: [],
  outputs: [],
  activeRequest: null,
};

function createStarRequest$(id: number) {
  return of({ id, stars: 9907 + id }).pipe(delay(id === 0 ? 1800 : id === 1 ? 1400 : 600));
}

export class SwitchMapDemoModel {
  private readonly stateSubject = new BehaviorSubject<SwitchMapDemoState>(INITIAL_STATE);
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
      status: "source$ 模拟用户连续点击；后一次请求出现时，switchMap 会退订前一次请求",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const result$ = of(0, 1, 2).pipe(
      concatMap((value) => of(value).pipe(delay(value === 0 ? 0 : 500))),
      tap((value) => {
        const activeRequest = this.state.activeRequest;
        const cancelledRequests =
          activeRequest === null || this.state.outputs.some((item) => item.id === activeRequest)
            ? this.state.cancelledRequests
            : [...this.state.cancelledRequests, activeRequest];

        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: stamp() }],
          requests: [...this.state.requests, { id: value, at: stamp() }],
          cancelledRequests,
          activeRequest: value,
          status:
            activeRequest === null
              ? `点击 ${value} 发出 request${value}$，switchMap 开始等待它返回`
              : `点击 ${value} 发出 request${value}$，switchMap 取消 request${activeRequest}$ 并切到最新请求`,
        });
      }),
      switchMap((value) => createStarRequest$(value)),
    );

    this.subscription = result$.subscribe({
      next: (result) => {
        this.patchState({
          outputs: [...this.state.outputs, { ...result, at: stamp() }],
          activeRequest: null,
          status: `request${result.id}$ 返回 ${result.stars}，这是当前最新请求的结果`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeRequest: null,
          status: "switchMap 完成：旧请求结果不会覆盖新请求结果",
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

  private patchState(patch: Partial<SwitchMapDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
