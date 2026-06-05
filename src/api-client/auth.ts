import { getSession, signIn, signOut } from "next-auth/react";

import type { LoginInput, RegisterInput, User } from "@/shared/types/auth";

import { basicClient } from "./_instance";

/**
 * 登录：加解密由拦截器自动处理，Service 层无需关心
 */
export async function login(data: LoginInput): Promise<User> {
  const result = await signIn("credentials", {
    email: data.email,
    password: data.password,
    redirect: false,
  });

  if (result?.error) {
    throw new Error("Invalid email or password");
  }

  const user = await getMe();
  if (!user) {
    throw new Error("Unable to load current user");
  }
  return user;
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
