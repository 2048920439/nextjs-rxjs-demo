import { apiClient } from "@/api-client/_instance/client";
import { decryptResponseBody, encryptPayload } from "@/api-client/_utils/crypto";
import type { LoginInput, RegisterInput, User } from "@/shared/types/auth";

/**
 * 登录：自动加密敏感字段后通过 API 发送
 * 加密逻辑在传输层（api-client），Service 层无需关心
 */
export async function login(data: LoginInput): Promise<User> {
  const encrypted = encryptPayload({ email: data.email, password: data.password });
  const res = await apiClient.post<{ encrypted: string }>("/auth/login", { encrypted });
  if (!res.data.encrypted) throw new Error("Missing encrypted response");
  const body = decryptResponseBody(res.data.encrypted);
  if (!body.user) throw new Error("Missing user field in decrypted response");
  return body.user as User;
}

/**
 * 注册：自动加密敏感字段后通过 API 发送
 */
export async function register(data: RegisterInput): Promise<User> {
  const encrypted = encryptPayload({ email: data.email, password: data.password, name: data.name });
  const res = await apiClient.post<{ encrypted: string }>("/auth/register", { encrypted });
  if (!res.data.encrypted) throw new Error("Missing encrypted response");
  const body = decryptResponseBody(res.data.encrypted);
  if (!body.user) throw new Error("Missing user field in decrypted response");
  return body.user as User;
}

export async function logout(): Promise<void> {
  await apiClient.post("/auth/logout");
}

export async function getMe(): Promise<User | null> {
  try {
    const res = await apiClient.get<{ user: User }>("/auth/me");
    return res.data.user;
  } catch {
    return null;
  }
}
