import { compare, hash } from "bcryptjs";

import { auth } from "@/auth";

const SALT_ROUNDS = 10;

// --- Password utilities ---

export async function hashPassword(password: string): Promise<string> {
  return hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hashed: string): Promise<boolean> {
  return compare(password, hashed);
}

// --- Shared business logic (used by both Route Handlers and SSR pages) ---

export async function getCurrentUser() {
  const session = await auth();
  return session?.user ?? null;
}
