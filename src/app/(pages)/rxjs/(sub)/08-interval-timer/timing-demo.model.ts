import { BehaviorSubject, interval, type Subscription, timer } from "rxjs";

export type TimingDemoState = {
  intervalCount: number;
  intervalRunning: boolean;
  timerDelay: number;
  timerCount: number | null;
  timerRunning: boolean;
};

const INITIAL_STATE: TimingDemoState = {
  intervalCount: 0,
  intervalRunning: false,
  timerDelay: 2000,
  timerCount: null,
  timerRunning: false,
};

export class TimingDemoModel {
  private readonly stateSubject = new BehaviorSubject<TimingDemoState>(INITIAL_STATE);
  private intervalSubscription: Subscription | null = null;
  private timerSubscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  setTimerDelay(timerDelay: number) {
    this.patchState({ timerDelay });
  }

  startInterval() {
    this.intervalSubscription?.unsubscribe();
    this.patchState({ intervalCount: 0, intervalRunning: true });
    this.intervalSubscription = interval(1000).subscribe((value) => {
      this.patchState({ intervalCount: value + 1 });
    });
  }

  stopInterval() {
    this.intervalSubscription?.unsubscribe();
    this.intervalSubscription = null;
    this.patchState({ intervalRunning: false });
  }

  startTimer() {
    this.timerSubscription?.unsubscribe();
    this.patchState({ timerCount: null, timerRunning: true });
    this.timerSubscription = timer(this.state.timerDelay, 1000).subscribe((value) => {
      this.patchState({ timerCount: value + 1 });
    });
  }

  stopTimer() {
    this.timerSubscription?.unsubscribe();
    this.timerSubscription = null;
    this.patchState({ timerRunning: false });
  }

  dispose() {
    this.intervalSubscription?.unsubscribe();
    this.timerSubscription?.unsubscribe();
  }

  private patchState(patch: Partial<TimingDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
