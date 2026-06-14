import { BehaviorSubject, map, merge, scan, startWith, Subject, type Subscription } from "rxjs";

type CounterEvent = { type: "inc" } | { type: "reset" };

export class ClickCounterModel {
  private readonly clickSubject = new Subject<void>();
  private readonly resetSubject = new Subject<void>();
  private readonly countSubject = new BehaviorSubject(0);
  private subscription: Subscription | null = null;

  readonly count$ = this.countSubject.asObservable();

  constructor() {
    this.connectCounterStream();
  }

  get count() {
    return this.countSubject.value;
  }

  click() {
    this.connectCounterStream();
    this.clickSubject.next();
  }

  reset() {
    this.connectCounterStream();
    this.resetSubject.next();
  }

  dispose() {
    this.subscription?.unsubscribe();
    this.subscription = null;
  }

  private connectCounterStream() {
    if (this.subscription && !this.subscription.closed) return;

    const click$ = this.clickSubject.pipe(map(() => ({ type: "inc" }) as CounterEvent));
    const reset$ = this.resetSubject.pipe(map(() => ({ type: "reset" }) as CounterEvent));

    this.subscription = merge(click$, reset$)
      .pipe(
        scan((count, event) => (event.type === "reset" ? 0 : count + 1), 0),
        startWith(0),
      )
      .subscribe((count) => {
        this.countSubject.next(count);
      });
  }
}
