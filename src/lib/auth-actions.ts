"use server";

import { z } from "zod";

import { generateToken, hashPassword, setAuthCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// ====== Zod Schemas ======

const registerSchema = z.object({
  email: z.string().email("邮箱格式无效"),
  password: z.string().min(6, "密码至少需要 6 个字符"),
  name: z.string().min(1, "请输入用户名"),
});

const loginSchema = z.object({
  email: z.string().email("邮箱格式无效"),
  password: z.string().min(1, "请输入密码"),
});

// Valid bcrypt hash that will never match any real password (used for constant-time comparison)
const DUMMY_HASH = "$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

// ====== Action State ======

export interface AuthActionState {
  error: string;
  success: boolean;
}

// ====== Server Actions ======

export async function loginAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, success: false };
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  const passwordHash = user?.password ?? DUMMY_HASH;
  const isValid = await verifyPassword(password, passwordHash);

  if (!user || !isValid) {
    return { error: "邮箱或密码错误", success: false };
  }

  const token = await generateToken({ userId: user.id });
  await setAuthCookie(token);

  return { success: true, error: "" };
}

export async function registerAction(_prevState: AuthActionState, formData: FormData): Promise<AuthActionState> {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    name: formData.get("name"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message, success: false };
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { error: "该邮箱已被注册", success: false };
  }

  const hashedPassword = await hashPassword(password);

  await prisma.user.create({
    data: { email, password: hashedPassword, name },
  });

  const newUser = await prisma.user.findUnique({ where: { email } });
  if (!newUser) {
    return { error: "注册失败，请重试", success: false };
  }

  const token = await generateToken({ userId: newUser.id });
  await setAuthCookie(token);

  return { success: true, error: "" };
}
