import { BehaviorSubject, Subject, Subscription, timestamp, withLatestFrom } from "rxjs";

export type HoldTimerDemoState = {
  imperativeMs: number;
  reactiveMs: number;
};

const INITIAL_STATE: HoldTimerDemoState = {
  imperativeMs: 0,
  reactiveMs: 0,
};

export class HoldTimerDemoModel {
  private readonly stateSubject = new BehaviorSubject<HoldTimerDemoState>(INITIAL_STATE);
  private readonly reactiveDownSubject = new Subject<void>();
  private readonly reactiveUpSubject = new Subject<void>();
  private imperativeStartTime: number | null = null;
  private reactiveSubscription: Subscription | null = null;

  constructor() {
    this.connectReactiveStream();
  }

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  imperativeDown() {
    this.imperativeStartTime = Date.now();
    this.patchState({ imperativeMs: 0 });
  }

  imperativeUp() {
    if (this.imperativeStartTime === null) return;
    const imperativeMs = Date.now() - this.imperativeStartTime;
    this.imperativeStartTime = null;
    this.patchState({ imperativeMs });
  }

  reactiveDown() {
    this.connectReactiveStream();
    this.patchState({ reactiveMs: 0 });
    this.reactiveDownSubject.next();
  }

  reactiveUp() {
    this.connectReactiveStream();
    this.reactiveUpSubject.next();
  }

  dispose() {
    this.reactiveSubscription?.unsubscribe();
    this.reactiveSubscription = null;
  }

  private patchState(patch: Partial<HoldTimerDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }

  private connectReactiveStream() {
    if (this.reactiveSubscription && !this.reactiveSubscription.closed) return;

    this.reactiveSubscription = this.reactiveUpSubject
      .pipe(
        timestamp(),
        withLatestFrom(this.reactiveDownSubject.pipe(timestamp()), (up, down) => up.timestamp - down.timestamp),
      )
      .subscribe((reactiveMs) => {
        this.patchState({ reactiveMs });
      });
  }
}
