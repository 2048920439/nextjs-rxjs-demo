import type { LoginInput, RegisterInput, User } from "@/shared/types/auth";

import { basicClient } from "./_instance";

/**
 * 登录：加解密由拦截器自动处理，Service 层无需关心
 */
export async function login(data: LoginInput): Promise<User> {
  const res = await basicClient.post<User>("/auth/login", data, { crypto: true });
  return res.data;
}

/**
 * 注册：加解密由拦截器自动处理
 */
export async function register(data: RegisterInput): Promise<User> {
  const res = await basicClient.post<User>("/auth/register", data, { crypto: true });
  return res.data;
}

export async function logout(): Promise<void> {
  await basicClient.post("/auth/logout");
}

export async function getMe(): Promise<User | null> {
  try {
    const res = await basicClient.get<{ user: User }>("/auth/me", { crypto: true });
    return res.data.user;
  } catch {
    return null;
  }
}
