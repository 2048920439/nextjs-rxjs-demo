import { BehaviorSubject } from "rxjs";

import { BaseService } from "@/service-core/core";

export class CounterService extends BaseService {
  constructor() {
    super();
  }

  private readonly _count$ = new BehaviorSubject<number>(0);

  /** 只读的可观察流 */
  get count$() {
    return this._count$.asObservable();
  }

  /** 同步读取当前值 */
  get count(): number {
    return this._count$.value;
  }

  increment(): void {
    this._count$.next(this._count$.value + 1);
  }

  decrement(): void {
    this._count$.next(this._count$.value - 1);
  }

  reset(): void {
    this._count$.next(0);
  }
}
