import type { Subscription } from "rxjs";

/**
 * Effect 函数：接收上下文，返回可取消的副作用订阅。
 *
 * 设计原则：
 * - Effects DO NOT own state — 它们通过 ctx 读取命令流、写入状态
 * - Effects DO NOT know about concrete Service — 仅依赖抽象接口
 * - Effects ARE side-effect orchestrators — map commands to API calls then state changes
 */
export type Effect<TContext> = (ctx: TContext) => Subscription;

/**
 * 注册 effects 并返回订阅数组
 *
 * 每个 effect 接收同一个 ctx，独立启动订阅。
 * 返回值可供调用方统一管理生命周期（unsubscribe）。
 */
export function registerEffects<TContext>(ctx: TContext, effects: Effect<TContext>[]): Subscription[] {
  return effects.map((effect) => effect(ctx));
}
