import { BehaviorSubject, concatMap, delay, exhaustMap, of, type Subscription, tap } from "rxjs";

export type ExhaustMapSourceValue = {
  value: number;
  at: string;
};

export type ExhaustMapRequest = {
  id: number;
  at: string;
};

export type ExhaustMapResult = {
  id: number;
  message: string;
  at: string;
};

export type ExhaustMapDemoState = {
  running: boolean;
  status: string;
  sourceValues: ExhaustMapSourceValue[];
  acceptedRequests: ExhaustMapRequest[];
  ignoredRequests: ExhaustMapRequest[];
  outputs: ExhaustMapResult[];
  activeRequest: number | null;
};

const INITIAL_STATE: ExhaustMapDemoState = {
  running: false,
  status: "点击运行，观察 exhaustMap 如何忽略重叠请求",
  sourceValues: [],
  acceptedRequests: [],
  ignoredRequests: [],
  outputs: [],
  activeRequest: null,
};

function createLongPollingRequest$(id: number) {
  return of({ id, message: `message from request${id}$` }).pipe(delay(1400));
}

export class ExhaustMapDemoModel {
  private readonly stateSubject = new BehaviorSubject<ExhaustMapDemoState>(INITIAL_STATE);
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
      status: "source$ 模拟重复触发连接；当前连接未完成时，exhaustMap 不会调用新的 project",
    });

    const startAt = Date.now();
    const stamp = () => `${Date.now() - startAt}ms`;

    const result$ = of(0, 1, 2).pipe(
      concatMap((value) => of(value).pipe(delay(value === 0 ? 0 : value === 1 ? 500 : 1600))),
      tap((value) => {
        const request = { id: value, at: stamp() };
        const isIgnored = this.state.activeRequest !== null;

        this.patchState({
          sourceValues: [...this.state.sourceValues, { value, at: request.at }],
          acceptedRequests: isIgnored ? this.state.acceptedRequests : [...this.state.acceptedRequests, request],
          ignoredRequests: isIgnored ? [...this.state.ignoredRequests, request] : this.state.ignoredRequests,
          activeRequest: isIgnored ? this.state.activeRequest : value,
          status: isIgnored
            ? `request${value}$ 出现时 request${this.state.activeRequest}$ 仍在运行，exhaustMap 忽略这次触发`
            : `request${value}$ 被接受，exhaustMap 会先耗尽它`,
        });
      }),
      exhaustMap((value) => createLongPollingRequest$(value)),
    );

    this.subscription = result$.subscribe({
      next: (result) => {
        this.patchState({
          outputs: [...this.state.outputs, { ...result, at: stamp() }],
          activeRequest: null,
          status: `request${result.id}$ 完成，exhaustMap 可以接受后续触发`,
        });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({
          running: false,
          activeRequest: null,
          status: "exhaustMap 完成：重叠触发被忽略，已接受的请求完整输出",
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

  private patchState(patch: Partial<ExhaustMapDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
