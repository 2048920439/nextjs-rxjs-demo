import { BehaviorSubject, map, share, tap } from "rxjs";

import { BaseService } from "@/service-core";

/**
 * 演示"状态内聚编排"模式的数字 Service（页面私有）：
 * - _number$ BehaviorSubject 既是状态持有者也是通知源
 * - square$ 从 number$ 纯派生：map 断言平方关系，tap 桥接到同步世界
 * - _squareCache 提供同步快照；同时 square$ 本身可作为 Observable 被组合
 */
export class NumberOrchestrationService extends BaseService {
  constructor() {
    super();
  }

  // ── 源状态 ──
  private _number$ = new BehaviorSubject(1);
  readonly number$ = this._number$.asObservable();
  get number() {
    return this._number$.value;
  }

  // ── 派生状态：管道 = 纯派生 + 同步桥接 ──
  private _squareCache = this.number * this.number;
  get square() {
    return this._squareCache;
  }
  readonly square$ = this.number$.pipe(
    map((n) => n * n),
    tap((cached) => {
      this._squareCache = cached;
    }),
    share(),
  );

  // ── 对外突变方法 ──
  increment(): void {
    this._number$.next(this._number$.value + 1);
  }

  decrement(): void {
    this._number$.next(this._number$.value - 1);
  }

  reset(): void {
    this._number$.next(1);
  }
}
