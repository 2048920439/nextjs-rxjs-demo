import { NextResponse } from "next/server";
import { z } from "zod";

import { generateToken, setAuthCookie, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

// Valid bcrypt hash that will never match any real password (used for constant-time comparison)
const DUMMY_HASH =
  "$2a$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // Always call verifyPassword to prevent timing-based user enumeration.
    // When the user doesn't exist, compare against a dummy hash so the
    // bcrypt computation time is indistinguishable from a real attempt.
    const passwordHash = user?.password ?? DUMMY_HASH;
    const isValid = await verifyPassword(password, passwordHash);

    if (!user || !isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const token = await generateToken({ userId: user.id });
    await setAuthCookie(token);

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
