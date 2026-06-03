/**
 * 增强序列化工具
 *
 * 借鉴 ahooks useLocalStorageState 的 serializer/deserializer 模式，
 * 在 JSON.stringify/parse 基础上扩展对 Date / Map / Set / RegExp 的支持。
 *
 * 序列化策略：
 * - 基础类型（string/number/boolean/null）→ 直接 JSON 序列化
 * - Date        → { __type: "Date", v: <timestamp> }
 * - RegExp      → { __type: "RegExp", v: "/pattern/flags" }
 * - Map         → { __type: "Map", v: [[k1,v1],[k2,v2]] }
 * - Set         → { __type: "Set", v: [v1,v2,v3] }
 *
 * 反序列化时检测 __type 标记并还原为对应的原生类型。
 */

/**
 * 增强序列化类型约束
 *
 * 覆盖 JSON 基础类型 + Date / RegExp / Map / Set 的递归组合。
 * 配合 {@link enhancedStringify} / {@link enhancedParse} 使用，
 * 可在 localStorage 等场景中安全序列化/反序列化这些类型。
 *
 * 仍被排除：BigInt / Symbol / Function / class 实例
 */
export type Serializable =
  | string
  | number
  | boolean
  | null
  | Date
  | RegExp
  | Serializable[]
  | { [key: string]: Serializable }
  | Map<Serializable, Serializable>
  | Set<Serializable>;

const TYPE_KEY = "__q_type";

const enum TypeTag {
  Date = "Date",
  RegExp = "RegExp",
  Map = "Map",
  Set = "Set",
}

interface TypeEnvelope {
  [TYPE_KEY]: TypeTag;
  v: unknown;
}

function isEnvelope(obj: unknown): obj is TypeEnvelope {
  return typeof obj === "object" && obj !== null && TYPE_KEY in obj;
}

// ─── 序列化 replacer ─────────────────────────────────────

function stringifyReplacer(_key: string, value: unknown): unknown {
  if (value instanceof Date) {
    const ts = value.getTime();
    return Number.isFinite(ts) ? ({ [TYPE_KEY]: TypeTag.Date, v: ts } satisfies TypeEnvelope) : null;
  }
  if (value instanceof RegExp) {
    return { [TYPE_KEY]: TypeTag.RegExp, v: value.toString() } satisfies TypeEnvelope;
  }
  if (value instanceof Map) {
    return {
      [TYPE_KEY]: TypeTag.Map,
      v: Array.from(value.entries()),
    } satisfies TypeEnvelope;
  }
  if (value instanceof Set) {
    return {
      [TYPE_KEY]: TypeTag.Set,
      v: Array.from(value.values()),
    } satisfies TypeEnvelope;
  }
  return value;
}

// ─── 反序列化 reviver ────────────────────────────────────

function parseReviver(_key: string, value: unknown): unknown {
  if (!isEnvelope(value)) return value;

  switch (value[TYPE_KEY]) {
    case TypeTag.Date: {
      const ts = value.v as number;
      return typeof ts === "number" && Number.isFinite(ts) ? new Date(ts) : null;
    }

    case TypeTag.RegExp: {
      const str = value.v as string;
      const match = str.match(/^\/(.+)\/([dgimsuvy]*)$/);
      return match ? new RegExp(match[1], match[2]) : new RegExp(str);
    }

    case TypeTag.Map:
      return new Map(value.v as [unknown, unknown][]);

    case TypeTag.Set:
      return new Set(value.v as unknown[]);

    default:
      return value;
  }
}

// ─── 导出函数 ────────────────────────────────────────────

/**
 * 增强序列化：将 Date/Map/Set/RegExp 编码为 JSON-safe 结构后序列化
 *
 * @example
 * ```ts
 * enhancedStringify({ date: new Date(), tags: new Set(['a']) });
 * // '{"date":{"__q_type":"Date","v":1680000000000},"tags":{"__q_type":"Set","v":["a"]}}'
 * ```
 */
export function enhancedStringify<T extends Serializable>(value: T): string {
  return JSON.stringify(value, stringifyReplacer);
}

/**
 * 增强反序列化：检测 `__q_type` 标记并还原 Date/Map/Set/RegExp
 */
export function enhancedParse<T extends Serializable>(raw: string): T {
  return JSON.parse(raw, parseReviver) as T;
}
