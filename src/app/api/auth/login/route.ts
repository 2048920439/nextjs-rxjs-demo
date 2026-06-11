import { NextResponse } from "next/server";
import { encode } from "next-auth/jwt";
import { z } from "zod";

import { verifyPassword } from "@/lib/auth";
import { decryptRequestBody, encryptResponseBody } from "@/lib/crypto-server";
import { prisma } from "@/lib/prisma";

const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
});

const COOKIE_NAME = process.env.NODE_ENV === "production" ? "__Secure-authjs.session-token" : "authjs.session-token";
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = decryptRequestBody(body);
    const parsed = loginSchema.safeParse(data);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
    }

    const { email, password } = parsed.data;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const passwordValid = await verifyPassword(password, user.password);
    if (!passwordValid) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
    }

    const userPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: user.createdAt.getTime(),
    };

    const token = await encode({
      token: {
        user: userPayload,
        sub: String(user.id),
      },
      secret: process.env.AUTH_SECRET ?? process.env.JWT_SECRET!,
      salt: COOKIE_NAME,
      maxAge: COOKIE_MAX_AGE,
    });

    const response = NextResponse.json({ encrypted: encryptResponseBody({ user: userPayload }) }, { status: 200 });

    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: COOKIE_MAX_AGE,
    });

    return response;
  } catch (e) {
    if (
      e instanceof Error &&
      (e.message.includes("decryption") ||
        e.message.includes("encrypted") ||
        e.message.includes("encode") ||
        e.message.includes("decode") ||
        e.message.includes("JSON"))
    ) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
