import { BehaviorSubject, map, Subject, withLatestFrom } from "rxjs";

export type PublishRecord = {
  title: string;
  channel: string;
  priority: string;
};

const DEFAULT_TITLE = "周报：combineLatest 与 withLatestFrom";
const DEFAULT_CHANNEL = "Email";
const DEFAULT_PRIORITY = "Normal";
const INITIAL_STATUS = "修改内容后点击提交，主流会带上辅流最新快照";

export class WithLatestFromDemoModel {
  private readonly titleSubject = new BehaviorSubject(DEFAULT_TITLE);
  private readonly channelSubject = new BehaviorSubject(DEFAULT_CHANNEL);
  private readonly prioritySubject = new BehaviorSubject(DEFAULT_PRIORITY);
  private readonly statusSubject = new BehaviorSubject(INITIAL_STATUS);
  private readonly recordsSubject = new BehaviorSubject<PublishRecord[]>([]);
  private readonly runningSubject = new BehaviorSubject(true);
  private readonly submitSubject = new Subject<void>();

  readonly title$ = this.titleSubject.asObservable();
  readonly channel$ = this.channelSubject.asObservable();
  readonly priority$ = this.prioritySubject.asObservable();
  readonly status$ = this.statusSubject.asObservable();
  readonly records$ = this.recordsSubject.asObservable();
  readonly running$ = this.runningSubject.asObservable();
  readonly submitRecord$ = this.submitSubject.pipe(
    withLatestFrom(this.titleSubject, this.channelSubject, this.prioritySubject),
    map(([, title, channel, priority]) => ({ title, channel, priority })),
  );

  get title() {
    return this.titleSubject.value;
  }

  get channel() {
    return this.channelSubject.value;
  }

  get priority() {
    return this.prioritySubject.value;
  }

  get status() {
    return this.statusSubject.value;
  }

  get records() {
    return this.recordsSubject.value;
  }

  get running() {
    return this.runningSubject.value;
  }

  setTitle(title: string) {
    this.titleSubject.next(title);
  }

  setChannel(channel: string) {
    this.channelSubject.next(channel);
  }

  setPriority(priority: string) {
    this.prioritySubject.next(priority);
  }

  submit() {
    this.submitSubject.next();
  }

  publish(record: PublishRecord) {
    this.recordsSubject.next([...this.recordsSubject.value, record]);
    this.statusSubject.next(`已提交：${record.title} / ${record.channel} / ${record.priority}`);
  }

  reset() {
    this.titleSubject.next(DEFAULT_TITLE);
    this.channelSubject.next(DEFAULT_CHANNEL);
    this.prioritySubject.next(DEFAULT_PRIORITY);
    this.recordsSubject.next([]);
    this.statusSubject.next(INITIAL_STATUS);
  }
}
