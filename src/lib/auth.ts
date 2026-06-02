import { compare, hash } from "bcryptjs";
import { jwtVerify,SignJWT } from "jose";
import { cookies } from "next/headers";

import { getJwtSecret } from "@/lib/jwt-secret";
import { prisma } from "@/lib/prisma";

export const AUTH_COOKIE = "auth_token";
const SALT_ROUNDS = 10;

// --- Password utilities ---

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  hashed: string
): Promise<boolean> {
  return compare(password, hashed);
}

// --- JWT utilities (using jose for Edge Runtime compatibility) ---

export async function generateToken(payload: {
  userId: number;
}): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    return payload as { userId: number };
  } catch {
    return null;
  }
}

// --- Cookie utilities ---

export async function setAuthCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
}

export async function deleteAuthCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_COOKIE)?.value;
}

// --- Shared business logic (used by both Route Handlers and SSR pages) ---

export async function getCurrentUser() {
  const token = await getAuthCookie();
  if (!token) return null;

  const payload = await verifyToken(token);
  if (!payload) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  return user;
}
