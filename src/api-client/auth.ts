import type { LoginInput, RegisterInput, User } from "@/shared/types/auth";

import { apiClient } from "./client";

export async function login(data: LoginInput): Promise<User> {
  const res = await apiClient.post<{ user: User }>("/auth/login", data);
  return res.data.user;
}

export async function register(data: RegisterInput): Promise<User> {
  const res = await apiClient.post<{ user: User }>("/auth/register", data);
  return res.data.user;
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
