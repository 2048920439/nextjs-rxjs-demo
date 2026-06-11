import { getSession, signOut } from "next-auth/react";

import type { LoginInput, RegisterInput, User } from "@/shared/types/auth";

import { basicClient } from "./_instance";

/**
 * 登录：服务端 /api/auth/login 验证凭证并创建 session，客户端一次请求拿到 user
 */
export async function login(data: LoginInput): Promise<User> {
  const res = await basicClient.post<{ user: User }>("/auth/login", data, { crypto: true });
  return res.data.user;
}

/**
 * 注册：加解密由拦截器自动处理
 */
export async function register(data: RegisterInput): Promise<User> {
  const res = await basicClient.post<{ user: User }>("/auth/register", data, { crypto: true });
  return res.data.user;
}

export async function logout(): Promise<void> {
  await signOut({ redirect: false });
}

export async function getMe(): Promise<User | null> {
  const session = await getSession();
  return session?.user ?? null;
}
