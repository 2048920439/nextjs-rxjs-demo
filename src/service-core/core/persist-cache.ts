/** 缓存配置 */
export interface PersistCacheOptions<T = unknown> {
  /** 缓存 key */
  key: string;
  /** 缓存时长（毫秒），默认 0 表示永不过期 */
  ttl?: number;
  /**
   * 校验缓存数据是否有效
   * - rehydrate 时调用，传入反序列化后的值
   * - 返回 `false` 时丢弃缓存（同时清除 localStorage）
   * - 不传则跳过校验
   */
  check?: (value: T) => boolean;
}

/** 带 TTL 元信息的缓存条目 */
interface CacheEntry {
  /** 缓存值 */
  v: string;
  /** 写入时间戳（ms） */
  t: number;
}

/**
 * 本地持久化缓存管理器
 *
 * 封装 localStorage 读写 / TTL 过期管理 / check 有效性校验，
 * 为 PersistSubject 提供底层存储能力。
 */
export class PersistCache<T = unknown> {
  private readonly _key: string;
  private readonly _ttl: number;
  private readonly _check?: (value: T) => boolean;

  constructor(options: PersistCacheOptions<T>) {
    this._key = options.key;
    this._ttl = options.ttl ?? 0;
    this._check = options.check;
  }

  // ─── key 访问 ────────────────────────────────────────

  /** 缓存 key */
  get key(): string {
    return this._key;
  }

  /** 缓存时长（毫秒），0 表示永不过期 */
  get ttl(): number {
    return this._ttl;
  }

  // ─── 公开 API ────────────────────────────────────────

  /** 写入缓存（支持 TTL），接收原始值，内部统一 JSON 序列化 */
  set(value: unknown): void {
    try {
      const serialized = JSON.stringify(value);
      const content =
        this._ttl > 0
          ? JSON.stringify({
              v: serialized,
              t: Date.now(),
            } satisfies CacheEntry)
          : serialized;

      localStorage.setItem(this._key, content);
    } catch {
      // 写入失败静默忽略
    }
  }

  /** 读取缓存（检查 TTL 过期 + check 有效性），返回反序列化后的原始值 */
  get(): T | null {
    try {
      const content = localStorage.getItem(this._key);
      if (content == null) return null;

      let parsed: unknown;

      // TTL 过期检查
      if (this._ttl > 0) {
        try {
          const entry: CacheEntry = JSON.parse(content);
          if (entry.v !== undefined && entry.t !== undefined) {
            if (Date.now() - entry.t > this._ttl) {
              this.remove();
              return null;
            }
            parsed = JSON.parse(entry.v);
          }
        } catch {
          // 非 CacheEntry 格式，向后兼容旧数据
        }
      }

      // 无 TTL 或旧格式数据，直接反序列化
      if (parsed === undefined) {
        parsed = JSON.parse(content);
      }

      // check 有效性校验（与 TTL 同层级的缓存淘汰逻辑）
      if (this._check && !this._check(parsed as T)) {
        this.remove();
        return null;
      }

      return parsed as T;
    } catch {
      return null;
    }
  }

  /** 清除缓存 */
  remove(): void {
    localStorage.removeItem(this._key);
  }
}
