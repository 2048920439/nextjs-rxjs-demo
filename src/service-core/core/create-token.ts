/**
 * 带类型信息的 Symbol Token
 * 运行时是普通 symbol，编译时携带泛型类型 T
 */
export type InjectionToken<T> = symbol & { readonly __type?: T };

/**
 * 获取 Token 的类型信息
 */
export type GetTokenType<T> = T extends InjectionToken<infer U> ? U : never;

/**
 * 创建带类型关联的 Token
 * @param sym - Symbol 标识
 * @returns 携带类型信息的 Token
 */
export function createToken<T>(sym: symbol): InjectionToken<T> {
  return sym as InjectionToken<T>;
}
