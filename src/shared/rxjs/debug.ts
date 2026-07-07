import { type MonoTypeOperatorFunction, tap } from "rxjs";

/**
 * debug 输出支持的日志级别。
 *
 * level 控制普通 `next` 和 `complete` 消息使用哪个 console 方法。
 * `error` 通知始终通过 error 输出，确保调试开启时错误不会被降级隐藏。
 */
export type DebugLogLevel = "debug" | "info" | "warn" | "error";

/**
 * debug 操作符依赖的最小 logger 契约。
 *
 * 保持成 console 形状，是为了让调用方可以把默认 console 替换成测试 spy、
 * UI 日志收集器或结构化 logger，同时不改变操作符本身的行为。
 */
export type DebugLogger = Pick<Console, DebugLogLevel>;

/**
 * 自定义 debug op 实例配置。
 */
export type DebugOperatorOptions = {
  /** 覆盖全局环境开关，控制当前 debug op 实例是否输出日志。 */
  enabled?: boolean;
  /** `next` 和 `complete` 消息使用的 console 方法。 */
  level?: DebugLogLevel;
  /** 可选输出目标；默认使用 `globalThis.console`。 */
  logger?: Partial<DebugLogger>;
};

/**
 * 由 `createDebugOperator` 创建的自定义 debug op 实例。
 *
 * 第二个参数只允许传入日志级别，调用点没有 enabled 入口；
 * enabled 必须由环境变量或自定义 debug op 实例配置统一控制。
 */
export type DebugOperator = <T>(label: string, level?: DebugLogLevel) => MonoTypeOperatorFunction<T>;

type ResolvedDebugOptions = Required<DebugOperatorOptions>;

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const DEFAULT_LOGGER = globalThis.console as DebugLogger;

function readDebugEnabled() {
  const value = process.env.NEXT_PUBLIC_RXJS_DEBUG;

  if (typeof value === "string") {
    return TRUE_VALUES.has(value.trim().toLowerCase());
  }

  return process.env.NODE_ENV !== "production";
}

/**
 * 由 Next.js 注入的构建期 debug 开关。
 *
 * `next.config.ts` 会在非生产环境把 `NEXT_PUBLIC_RXJS_DEBUG` 设为 true，
 * 在生产环境设为 false。`NODE_ENV` fallback 用来保证测试环境或非 Next
 * 执行环境中也能复用这个工具。
 */
export const isRxjsDebugEnabled = readDebugEnabled();

/**
 * 创建一个自定义 debug op 实例。
 *
 * 配置优先级从低到高是：环境变量 < 自定义 debug op 实例配置 < 单点调用配置。
 * 单点调用配置只保留日志级别，因此 logger 和 enabled 都只能在 debug op 实例上统一配置。
 */
export function createDebugOperator(instanceName = "", operatorOptions: DebugOperatorOptions = {}): DebugOperator {
  return function debugInInstance<T>(label: string, level?: DebugLogLevel): MonoTypeOperatorFunction<T> {
    const debugLabel = instanceName ? `${instanceName}:${label}` : label;
    return createDebugOperatorCore(debugLabel, operatorOptions, level);
  };
}

/**
 * 默认 debug 操作符。
 *
 * 等价于 `createDebugOperator()` 的结果，适合不需要单独实例名或 logger 的临时调试点。
 */
export const debug = createDebugOperator();

function createDebugOperatorCore<T>(label: string, operatorOptions: DebugOperatorOptions, level: DebugLogLevel | undefined): MonoTypeOperatorFunction<T> {
  const options = resolveDebugOptions(operatorOptions, level);

  if (!options.enabled) {
    return (source$) => source$;
  }

  return tap({
    next: (value) => writeLog(options.logger, options.level, `[${label}] next`, value),
    error: (error) => writeLog(options.logger, "error", `[${label}] error`, error),
    complete: () => writeLog(options.logger, options.level, `[${label}] complete`),
  });
}

function resolveDebugOptions(operatorOptions: DebugOperatorOptions, level: DebugLogLevel | undefined): ResolvedDebugOptions {
  return {
    enabled: operatorOptions.enabled ?? isRxjsDebugEnabled,
    level: level ?? operatorOptions.level ?? "debug",
    logger: operatorOptions.logger ?? DEFAULT_LOGGER,
  };
}

function writeLog(logger: Partial<DebugLogger>, level: DebugLogLevel, ...args: unknown[]) {
  const method = logger[level];

  if (method) {
    method.call(logger, ...args);
    return;
  }

  DEFAULT_LOGGER[level](...args);
}
