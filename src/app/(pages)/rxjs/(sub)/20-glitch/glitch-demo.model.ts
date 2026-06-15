import { BehaviorSubject, combineLatest, fromEvent, map, Subscription, withLatestFrom } from "rxjs";

export type ClickPoint = {
  x: number;
  y: number;
};

export type GlitchLog = {
  render: number;
  value: string;
  stale: boolean;
};

export type GlitchDemoState = {
  status: string;
  clickCount: number;
  latestPoint: ClickPoint | null;
  combineLatestLogs: GlitchLog[];
  withLatestFromLogs: GlitchLog[];
};

const INITIAL_STATE: GlitchDemoState = {
  status: "在坐标面板内点击，观察 combineLatest 和 withLatestFrom 的输出次数",
  clickCount: 0,
  latestPoint: null,
  combineLatestLogs: [],
  withLatestFromLogs: [],
};

export class GlitchDemoModel {
  private readonly stateSubject = new BehaviorSubject<GlitchDemoState>(INITIAL_STATE);
  private eventSubscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  attachClickTarget(element: HTMLElement) {
    this.eventSubscription?.unsubscribe();
    this.stateSubject.next(INITIAL_STATE);

    const subscription = new Subscription();
    const event$ = fromEvent<PointerEvent>(element, "pointerdown").pipe(
      map((event) => {
        const rect = element.getBoundingClientRect();

        return {
          x: Math.round(event.clientX - rect.left),
          y: Math.round(event.clientY - rect.top),
        };
      }),
    );
    const x$ = event$.pipe(map((event) => event.x));
    const y$ = event$.pipe(map((event) => event.y));

    subscription.add(
      event$.subscribe((point) => {
        this.patchState({
          status: `第 ${this.state.clickCount + 1} 次点击：真实 pointerdown 事件发出 x=${point.x}, y=${point.y}`,
          clickCount: this.state.clickCount + 1,
          latestPoint: point,
        });
      }),
    );

    subscription.add(
      combineLatest([x$, y$])
        .pipe(map(([x, y]) => ({ x, y })))
        .subscribe((point) => {
          const expected = this.state.latestPoint;
          const stale = expected !== null && (point.x !== expected.x || point.y !== expected.y);

          this.patchState({
            combineLatestLogs: [
              ...this.state.combineLatestLogs,
              {
                render: this.state.combineLatestLogs.length + 1,
                value: `x: ${point.x}, y: ${point.y}`,
                stale,
              },
            ],
          });
        }),
    );

    subscription.add(
      x$
        .pipe(
          withLatestFrom(y$),
          map(([x, y]) => ({ x, y })),
        )
        .subscribe((point) => {
          this.patchState({
            status: `第 ${this.state.clickCount} 次点击：withLatestFrom 只按主流 x$ 输出一次`,
            withLatestFromLogs: [
              ...this.state.withLatestFromLogs,
              {
                render: this.state.withLatestFromLogs.length + 1,
                value: `x: ${point.x}, y: ${point.y}`,
                stale: false,
              },
            ],
          });
        }),
    );

    this.eventSubscription = subscription;

    return () => {
      subscription.unsubscribe();
      if (this.eventSubscription === subscription) {
        this.eventSubscription = null;
      }
    };
  }

  reset() {
    this.patchState(INITIAL_STATE);
  }

  dispose() {
    this.eventSubscription?.unsubscribe();
    this.eventSubscription = null;
  }

  private patchState(patch: Partial<GlitchDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
