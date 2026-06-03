import { SYMMETRIC_KEY } from "@/config/crypto-client";
import { createSymmetric } from "@/shared/crypto";
import type { Serializable } from "@/shared/utils/serializer";
import { enhancedParse, enhancedStringify } from "@/shared/utils/serializer";

/** 延迟初始化的对称加密单例 */
let _symmetric: ReturnType<typeof createSymmetric> | null = null;
function getSymmetric() {
  return (_symmetric ??= createSymmetric(SYMMETRIC_KEY));
}

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
  /**
   * 是否启用对称加密（默认 false）
   * - 启用后，localStorage 中存储的是 NaCl secretbox 密文
   * - 密钥在 src/config/crypto.ts 中定义
   */
  encrypt?: boolean;
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
  private readonly _encrypt: boolean;

  constructor(options: PersistCacheOptions<T>) {
    this._key = options.key;
    this._ttl = options.ttl ?? 0;
    this._check = options.check;
    this._encrypt = options.encrypt ?? false;
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
      const serialized = enhancedStringify({ v: value, t: Date.now() });
      const stored = this._encrypt ? getSymmetric().encryptString(serialized) : serialized;
      localStorage.setItem(this._key, stored);
    } catch {
      // 写入失败静默忽略
    }
  }

  /** 读取缓存（TTL 过期检查 + check 校验），返回反序列化后的原始值 */
  get(): T | null {
    try {
      const content = localStorage.getItem(this._key);
      if (content == null) return null;

      const serialized = this._encrypt ? getSymmetric().decryptString(content) : content;
      const entry = enhancedParse<{ v: T; t: number }>(serialized);

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
