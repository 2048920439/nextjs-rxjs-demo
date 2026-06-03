export interface PromiseQueueOptions {
  /** 最大并行执行数量，默认为Infinity */
  maxConcurrency?: number;
}

// 任务类型枚举
enum TaskType {
  /**
   * 普通任务
   */
  Normal = "normal",
  /**
   * 屏障任务
   * 后续任务需要等待该任务及之前的任务执行完成后才执行
   */
  Barrier = "barrier",
  /**
   * 等待点任务
   * 等待执行队列中所有任务执行完成后再执行该任务及后续任务
   */
  Await = "await",
}

// 任务接口
interface QueueTask {
  type: TaskType;
  task: () => Promise<unknown>;
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}

/**
 * Promise任务队列管理器
 * 支持任务排队、并行控制、等待机制等功能
 *
 * 核心功能：
 *   任务排队执行：按照添加顺序执行任务
 *   并发控制：限制同时执行的任务数量
 *   等待点支持：可以等待之前所有任务完成后再继续
 *   动态任务添加：任务可以在执行过程中动态添加
 */
export class PromiseQueue {
  /**
   * 任务类型枚举
   */
  static readonly TaskType = TaskType;

  // 等待执行的任务队列
  private pendingQueue: QueueTask[] = [];

  // 正在执行的任务队列
  private executingQueue: QueueTask[] = [];

  // 最大并发数
  private readonly maxConcurrency: number;

  // 是否暂停
  private isPaused = false;

  // 是否有屏障任务正在执行或等待执行
  private hasBarrier = false;

  constructor(options: PromiseQueueOptions = {}) {
    this.maxConcurrency = options.maxConcurrency ?? Infinity;
  }

  /**
   * 添加一个普通任务到队列
   * @param task 返回Promise的函数或普通函数
   * @param type 任务类型 参考TaskType中的介绍
   * @returns Promise，任务完成时resolve
   */
  push<T>(task: () => Promise<T> | T, type: TaskType = TaskType.Normal): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const wrappedTask = () => {
        try {
          const result = task();
          return Promise.resolve(result).then(resolve).catch(reject);
        } catch (error) {
          reject(error);
          return Promise.reject(error);
        }
      };

      // 将任务添加到待执行队列
      this.pendingQueue.push({
        type,
        task: wrappedTask,
        resolve: resolve as (value: unknown) => void,
        reject: reject as (reason: unknown) => void,
      });
      // 触发任务处理
      this.process();
    });
  }

  /**
   * 等待队列中的所有任务执行完成
   * @returns Promise，等待完成时resolve
   */
  waitForIdle(): Promise<void> {
    // 如果当前没有正在运行的任务且队列为空，立即resolve
    if (this.executingQueue.length === 0 && this.pendingQueue.length === 0) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      this.push(resolve, TaskType.Await);
    });
  }

  /**
   * 暂停执行新任务
   */
  pause(): void {
    this.isPaused = true;
  }

  /**
   * 恢复执行新任务
   */
  resume(): void {
    this.isPaused = false;
    this.process();
  }

  /**
   * 清空队列
   */
  clear(): void {
    this.pendingQueue = [];
    this.executingQueue = [];
    this.hasBarrier = false;
  }

  /**
   * 获取队列状态
   */
  getStatus() {
    return {
      pendingQueueLength: this.pendingQueue.length,
      executingQueueLength: this.executingQueue.length,
      isPaused: this.isPaused,
      hasBarrier: this.hasBarrier,
    };
  }

  /**
   * 处理队列中的任务
   */
  private process(): void {
    // 如果暂停，则不处理
    if (this.isPaused) return;

    // 如果达到最大并发数，则不处理
    if (this.executingQueue.length >= this.maxConcurrency) return;

    // 如果没有等待执行的任务，则不处理
    if (!this.pendingQueue.length) return;

    // 如果有屏障任务正在执行或等待执行，则不添加新任务
    if (this.hasBarrier && this.executingQueue.length > 0) return;
    // 检查待执行队列中的第一个任务
    const firstPendingTask = this.pendingQueue[0];

    // 如果等待队列中的第一个任务为AwaitPoint，需要等待运行队列为空才进入运行队列
    if (firstPendingTask.type === TaskType.Await && this.executingQueue.length > 0) return;

    // 取出队列中的第一个任务
    const queueTask = this.pendingQueue.shift()!;

    // 如果是屏障任务，设置屏障标记
    if (queueTask.type === TaskType.Barrier) {
      this.hasBarrier = true;
    }

    // 将任务添加到执行队列
    this.executingQueue.push(queueTask);

    // 执行任务
    queueTask
      .task()
      .then((result) => {
        // 任务成功完成，调用resolve
        queueTask.resolve(result);
      })
      .catch((error) => {
        // 任务失败，调用reject
        queueTask.reject(error);
      })
      .finally(() => {
        // 从执行队列中移除任务
        const index = this.executingQueue.indexOf(queueTask);
        if (index !== -1) {
          this.executingQueue.splice(index, 1);
        }

        // 执行队列为空，重置屏障标记
        if (!this.executingQueue.length) {
          this.hasBarrier = false;
        }

        // 检查是否还有任务需要处理
        if (!this.isPaused) {
          // 继续处理队列
          this.process();
        }
      });

    // 继续处理队列中的任务
    this.process();
  }
}
