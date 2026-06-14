import { BehaviorSubject, of, type Subscription } from "rxjs";

export type ObserverDemoState = {
  subscribed: boolean;
  completed: boolean;
  records: number[];
};

const INITIAL_STATE: ObserverDemoState = {
  subscribed: false,
  completed: false,
  records: [],
};

export class ObserverDemoModel {
  private readonly stateSubject = new BehaviorSubject<ObserverDemoState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  subscribe() {
    this.patchState({ records: [], completed: false, subscribed: true });
    const records: number[] = [];

    this.subscription = of(1, 2, 3).subscribe({
      next: (value) => {
        records.push(value);
        this.patchState({ records: [...records] });
      },
      complete: () => {
        this.subscription = null;
        this.patchState({ completed: true, subscribed: false });
      },
    });
  }

  unsubscribe() {
    this.subscription?.unsubscribe();
    this.subscription = null;
    this.patchState({ subscribed: false });
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private patchState(patch: Partial<ObserverDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
