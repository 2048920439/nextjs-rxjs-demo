import { withResolvers } from "./utils";

export interface PollingParams<T> {
  /**
   * 轮询下一轮
   */
  next: () => void;
  /**
   * 轮询失败
   */
  reject: (err: unknown) => void;
  /**
   * 轮询成功
   */
  resolve: (data: T) => void;
  /**
   * 当前轮询次数
   */
  attempts: number;
  /**
   * 已消耗时间（毫秒）
   */
  elapsedTime: number;
}

export interface PollingConfig {
  /**
   * 轮询间隔（毫秒）
   */
  delay?: number;
  /**
   * 最大轮询次数
   */
  maxAttempts?: number;
  /**
   * 最大轮询时间（毫秒）
   */
  maxElapsedTime?: number;
}

/**
 * 轮询
 * @param cb 轮询回调
 * @param config 轮询配置
 */
export function polling<T = void>(cb: (params: PollingParams<T>) => Promise<void> | void, config: PollingConfig = {}): Promise<T> {
  const { delay = 1000, maxAttempts = Number.MAX_SAFE_INTEGER, maxElapsedTime = Number.MAX_SAFE_INTEGER } = config;

  const { promise, resolve, reject } = withResolvers<T>();
  // 记录开始时间
  const startTime = Date.now();
  // 标志轮询是否完成
  let isDone = false;
  // 当前轮询次数
  let attempts = 1;

  const process = async () => {
    // 如果已完成，直接退出
    if (isDone) return;
    // 计算消耗时间
    const elapsedTime = Date.now() - startTime;

    // 检查轮询边界条件
    if (attempts > maxAttempts) {
      isDone = true;
      reject(new Error(`Exceeded maxAttempts: ${attempts} > ${maxAttempts}`));
      return;
    }
    if (elapsedTime > maxElapsedTime) {
      isDone = true;
      reject(new Error(`Exceeded maxElapsedTime: ${elapsedTime}ms > ${maxElapsedTime}ms`));
      return;
    }

    let timer: ReturnType<typeof setTimeout>;

    try {
      let isActioned = false;
      await cb({
        attempts,
        elapsedTime,
        next: () => {
          if (isDone) return;
          if (isActioned) return;
          isActioned = true;

          attempts++;
          timer = setTimeout(process, delay);
        },
        resolve: (data) => {
          if (isDone) return;
          if (isActioned) return;
          isDone = true;
          isActioned = true;

          clearTimeout(timer);
          resolve(data);
        },
        reject: (err) => {
          if (isDone) return;
          if (isActioned) return;
          isDone = true;
          isActioned = true;

          clearTimeout(timer);
          reject(err);
        },
      });
      if (!isActioned) {
        throw new Error("cb is not actioned");
      }
    } catch (err) {
      if (isDone) return;
      isDone = true;
      reject(err);
    }
  };

  process(); // 启动轮询
  return promise;
}
