import { BehaviorSubject, interval, map, Subject, type Subscription, take } from "rxjs";

export type ObserverRecord = {
  id: number;
  values: number[];
  joinedAt: number;
  completed?: boolean;
};

export type HotColdDemoState = {
  coldRunning: boolean;
  hotRunning: boolean;
  coldObservers: ObserverRecord[];
  hotObservers: ObserverRecord[];
  hotProducerValue: number;
};

const INITIAL_STATE: HotColdDemoState = {
  coldRunning: false,
  hotRunning: false,
  coldObservers: [],
  hotObservers: [],
  hotProducerValue: 0,
};

const EMIT_LIMIT = 10;
const EMIT_INTERVAL = 1000;

export class HotColdDemoModel {
  private readonly stateSubject = new BehaviorSubject<HotColdDemoState>(INITIAL_STATE);
  private readonly coldSubscriptions: Subscription[] = [];
  private readonly hotSubscriptions: Subscription[] = [];
  private hotProducerSubscription: Subscription | null = null;
  private hotSubject: Subject<number> | null = null;
  private observerId = 0;

  readonly state$ = this.stateSubject.asObservable();

  get state() {
    return this.stateSubject.value;
  }

  addColdObserver() {
    const id = ++this.observerId;
    this.patchState({
      coldRunning: true,
      coldObservers: [...this.state.coldObservers, { id, values: [], joinedAt: 0, completed: false }],
    });

    const source$ = interval(EMIT_INTERVAL).pipe(
      take(EMIT_LIMIT),
      map((index) => index + 1),
    );

    const subscription = source$.subscribe({
      next: (value) => {
        this.patchColdObserver(id, (observer) => ({ ...observer, values: [...observer.values, value] }));
      },
      complete: () => {
        this.patchColdObserver(id, (observer) => ({ ...observer, completed: true }));
        if (this.state.coldObservers.every((observer) => observer.completed)) {
          this.patchState({ coldRunning: false });
        }
      },
    });

    this.coldSubscriptions.push(subscription);
  }

  addHotObserver() {
    this.ensureHotProducer();

    const id = ++this.observerId;
    this.patchState({
      hotObservers: [...this.state.hotObservers, { id, values: [], joinedAt: this.state.hotProducerValue, completed: false }],
    });

    const subscription = this.hotSubject!.subscribe({
      next: (value) => {
        this.patchHotObserver(id, (observer) => ({ ...observer, values: [...observer.values, value] }));
      },
      complete: () => {
        this.patchHotObserver(id, (observer) => ({ ...observer, completed: true }));
      },
    });

    this.hotSubscriptions.push(subscription);
  }

  resetCold() {
    this.coldSubscriptions.splice(0).forEach((subscription) => subscription.unsubscribe());
    this.patchState({ coldRunning: false, coldObservers: [] });
  }

  resetHot() {
    this.hotSubscriptions.splice(0).forEach((subscription) => subscription.unsubscribe());
    this.hotProducerSubscription?.unsubscribe();
    this.hotProducerSubscription = null;
    this.hotSubject = null;
    this.patchState({ hotRunning: false, hotObservers: [], hotProducerValue: 0 });
  }

  resetAll() {
    this.resetCold();
    this.resetHot();
  }

  dispose() {
    this.resetAll();
  }

  private ensureHotProducer() {
    if (this.hotProducerSubscription) return;

    const subject = new Subject<number>();
    this.hotSubject = subject;
    this.patchState({ hotRunning: true, hotProducerValue: 0 });

    this.hotProducerSubscription = interval(EMIT_INTERVAL)
      .pipe(
        take(EMIT_LIMIT),
        map((index) => index + 1),
      )
      .subscribe({
        next: (value) => {
          this.patchState({ hotProducerValue: value });
          subject.next(value);
        },
        complete: () => {
          subject.complete();
          this.hotProducerSubscription = null;
          this.hotSubject = null;
          this.patchState({ hotRunning: false });
        },
      });
  }

  private patchColdObserver(id: number, updater: (observer: ObserverRecord) => ObserverRecord) {
    this.patchState({
      coldObservers: this.state.coldObservers.map((observer) => (observer.id === id ? updater(observer) : observer)),
    });
  }

  private patchHotObserver(id: number, updater: (observer: ObserverRecord) => ObserverRecord) {
    this.patchState({
      hotObservers: this.state.hotObservers.map((observer) => (observer.id === id ? updater(observer) : observer)),
    });
  }

  private patchState(patch: Partial<HotColdDemoState>) {
    this.stateSubject.next({ ...this.state, ...patch });
  }
}
