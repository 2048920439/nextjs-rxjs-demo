import { NextResponse } from "next/server";
import { z } from "zod";

import { deleteAuthCookie, generateToken, getCurrentUser, hashPassword, setAuthCookie, verifyPassword } from "@/lib/auth";
import { decryptRequestBody, encryptResponseBody } from "@/lib/crypto-server";
import { prisma } from "@/lib/prisma";

// --- Schemas ---

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Valid bcrypt hash that will never match any real password (used for constant-time comparison)
const DUMMY_HASH = "$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

// --- Handler functions ---

async function handleRegister(request: Request) {
  const body = await request.json();
  const data = decryptRequestBody(body);
  const parsed = registerSchema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, password, name } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const hashedPassword = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, password: hashedPassword, name },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const token = await generateToken({ userId: user.id });
  await setAuthCookie(token);

  return NextResponse.json({ encrypted: encryptResponseBody({ user: { ...user, createdAt: user.createdAt.getTime() } }) }, { status: 201 });
}

async function handleLogin(request: Request) {
  const body = await request.json();
  const data = decryptRequestBody(body);
  const parsed = loginSchema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });

  const passwordHash = user?.password ?? DUMMY_HASH;
  const isValid = await verifyPassword(password, passwordHash);

  if (!user || !isValid) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const token = await generateToken({ userId: user.id });
  await setAuthCookie(token);

  return NextResponse.json({
    encrypted: encryptResponseBody({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.getTime(),
      },
    }),
  });
}

async function handleLogout() {
  await deleteAuthCookie();
  return NextResponse.json({ success: true });
}

async function handleMe() {
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  return NextResponse.json({ user });
}

// --- Route dispatcher ---

type Params = Promise<{ path: string[] }>;

export async function GET(_request: Request, { params }: { params: Params }) {
  try {
    const { path } = await params;

    switch (path[0]) {
      case "me":
        return handleMe();
      default:
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Params }) {
  try {
    const { path } = await params;

    switch (path[0]) {
      case "register":
        return handleRegister(request);
      case "login":
        return handleLogin(request);
      case "logout":
        return handleLogout();
      default:
        return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
