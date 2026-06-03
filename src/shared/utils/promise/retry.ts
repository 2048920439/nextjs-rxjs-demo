import { sleep } from "./utils";

export interface RetryInfo {
  /** 当前重试次数 */
  attempt: number;
  /** 当前重试错误 */
  error: unknown;
  /** 最大重试次数 */
  retries: number;
}

export interface RetryOptions<T = void> {
  /** 重试次数，默认为 3 */
  retries?: number;
  /** 重试间隔时间(毫秒)，可以是固定数字或函数动态计算，默认为指数退避函数 */
  delay?: number | ((retryInfo: RetryInfo) => number);
  /** 自定义响应结果是否符合预期的判断，如果不符合预期则进入下次重试，默认是种任务成功 */
  isSuccess?: (result: T) => boolean;
}

export class RetryFailedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RetryFailedError";
  }
}

/**
 * 默认的指数退避延迟函数
 * @param retryInfo 重试信息
 * @returns 延迟时间(毫秒)
 * @example 指数退避: 1000ms, 2000ms, 4000ms, 8000ms...
 */
const DefaultDelay: RetryOptions["delay"] = ({ attempt }) => 2 ** attempt * 1000;

/**
 * 重试函数，用于自动重试返回 Promise 的函数
 * @param fn 需要重试的函数
 * @param options 重试配置选项
 * @returns Promise<T>
 */
export async function retry<T>(fn: () => Promise<T>, options: RetryOptions<T> = {}): Promise<T> {
  const { retries = 3, delay = DefaultDelay, isSuccess = () => true } = options;

  let lastError: unknown = new RetryFailedError("unknown error");

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const result = await fn();

      if (isSuccess(result)) return result;

      // noinspection ExceptionCaughtLocallyJS
      throw new RetryFailedError("retry failed");
    } catch (err) {
      const error = err instanceof RetryFailedError ? lastError : err;
      lastError = error;
      if (attempt === retries) throw error;

      const delayMs = typeof delay === "function" ? delay({ attempt, error, retries }) : delay!;

      await sleep(delayMs);
    }
  }

  throw lastError;
}
