/**
 * 判断对象是否包含某个key
 */
export const has = <T extends object>(obj: T, key: PropertyKey): key is keyof T => Object.prototype.hasOwnProperty.call(obj, key);

/**
 * 获取对象中的某些key,不改变原对象
 */
export const pick = <TObj extends object, TKeys extends Array<keyof TObj>>(obj: TObj, keys: TKeys): Pick<TObj, TKeys[number]> => {
  return keys.filter((key) => has(obj, key)).reduce((prev, key) => ({ ...prev, [key]: obj[key] }), {} as Pick<TObj, TKeys[number]>);
};

/**
 * 删除对象中的某些key,不改变原对象
 */
export const omit = <TObj extends object, TKeys extends Array<keyof TObj>>(obj: TObj, keys: TKeys): Omit<TObj, TKeys[number]> => {
  const objKeys = Object.keys(obj) as Array<keyof TObj>;
  return objKeys.filter((key) => !keys.includes(key)).reduce((prev, key) => ({ ...prev, [key]: obj[key] }), {} as Omit<TObj, TKeys[number]>);
};

/**
 * 浅比较函数：比较两个对象的第一层属性
 * 对 Map/Set/Date 等内置类型做特判，避免 Object.keys 遗漏内部状态导致误判相等
 */
export function shallowEqual<T>(objA: T, objB: T): boolean {
  if (Object.is(objA, objB)) return true;

  if (typeof objA !== "object" || objA === null || typeof objB !== "object" || objB === null) {
    return false;
  }

  // 类型不一致直接不等（Map vs Set, Date vs Object 等）
  if (objA.constructor !== objB.constructor) return false;

  // Map：逐个键值对 Object.is 比较
  if (objA instanceof Map && objB instanceof Map) {
    if (objA.size !== objB.size) return false;
    for (const [key, val] of objA) {
      if (!objB.has(key) || !Object.is(val, objB.get(key))) return false;
    }
    return true;
  }

  // Set：逐个元素 Object.is 比较
  if (objA instanceof Set && objB instanceof Set) {
    if (objA.size !== objB.size) return false;
    for (const item of objA) {
      if (!objB.has(item)) return false;
    }
    return true;
  }

  // Date：比较时间戳
  if (objA instanceof Date && objB instanceof Date) {
    return objA.getTime() === objB.getTime();
  }

  // 普通对象/数组：逐键 Object.is 比较
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;

  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key) || !Object.is((objA as Record<string, unknown>)[key], (objB as Record<string, unknown>)[key])) {
      return false;
    }
  }

  return true;
}
