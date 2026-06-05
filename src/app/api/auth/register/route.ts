import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword } from "@/lib/auth";
import { decryptRequestBody, encryptResponseBody } from "@/lib/crypto-server";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(1, "Name is required"),
});

export async function POST(request: Request) {
  try {
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

    const user = await prisma.user.create({
      data: { email, password: await hashPassword(password), name },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return NextResponse.json(
      {
        encrypted: encryptResponseBody({
          user: { ...user, createdAt: user.createdAt.getTime() },
        }),
      },
      { status: 201 },
    );
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
