import type { Serializable } from "@/shared/utils/serializer";
import { enhancedParse, enhancedStringify } from "@/shared/utils/serializer";

/** 缓存配置 */
export interface PersistCacheOptions<T extends Serializable = Serializable> {
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

/**
 * 本地持久化缓存管理器
 *
 * 封装 localStorage 读写 / TTL 过期管理 / check 有效性校验，
 * 为 PersistSubject 提供底层存储能力。
 */
export class PersistCache<T extends Serializable = Serializable> {
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

  /** 写入缓存，存储 { v: 值, t: 时间戳 } */
  set(value: T): void {
    try {
      localStorage.setItem(this._key, enhancedStringify({ v: value, t: Date.now() }));
    } catch {
      // 写入失败静默忽略
    }
  }

  /** 读取缓存（TTL 过期检查 + check 校验），返回反序列化后的原始值 */
  get(): T | null {
    try {
      const content = localStorage.getItem(this._key);
      if (content == null) return null;

      const entry = enhancedParse<{ v: T; t: number }>(content);

      // TTL 过期检查（_ttl = 0 表示永不过期）
      if (this._ttl > 0 && Date.now() - entry.t > this._ttl) {
        this.remove();
        return null;
      }

      if (this._check && !this._check(entry.v)) {
        this.remove();
        return null;
      }
      return entry.v;
    } catch {
      return null;
    }
  }

  /** 清除缓存 */
  remove(): void {
    localStorage.removeItem(this._key);
  }
}
