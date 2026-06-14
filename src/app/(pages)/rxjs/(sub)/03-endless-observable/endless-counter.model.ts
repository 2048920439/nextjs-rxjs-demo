import { BehaviorSubject, Observable, type Subscription } from "rxjs";

export type EndlessCounterState = {
  subscribed: boolean;
  count: number;
  history: number[];
};

const INITIAL_STATE: EndlessCounterState = {
  subscribed: false,
  count: 0,
  history: [],
};

export class EndlessCounterModel {
  private readonly stateSubject = new BehaviorSubject<EndlessCounterState>(INITIAL_STATE);
  private subscription: Subscription | null = null;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  subscribe() {
    this.subscription?.unsubscribe();
    this.patchState({ subscribed: true, count: 0, history: [] });

    const source$ = new Observable<number>((subscriber) => {
      let value = 1;
      const handle = window.setInterval(() => {
        subscriber.next(value++);
      }, 1000);

      return () => window.clearInterval(handle);
    });

    this.subscription = source$.subscribe((count) => {
      const history = [...this.state.history, count].slice(-8);
      this.patchState({ count, history });
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

  private patchState(patch: Partial<EndlessCounterState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
