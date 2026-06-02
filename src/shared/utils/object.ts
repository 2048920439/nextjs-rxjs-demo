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
