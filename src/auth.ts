import { compare } from "bcryptjs";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import type { User as AppUser } from "@/shared/types/auth";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

declare module "next-auth" {
  interface User {
    createdAt: number;
  }

  interface Session {
    user: AppUser;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.JWT_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) return null;

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        });
        if (!user) return null;

        const passwordValid = await compare(parsed.data.password, user.password);
        if (!passwordValid) return null;

        return {
          id: String(user.id),
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.getTime(),
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.user = {
          id: Number(user.id),
          email: user.email ?? "",
          name: user.name ?? "",
          createdAt: user.createdAt,
        } satisfies AppUser;
      }
      return token;
    },
    session({ session, token }) {
      if (token.user) {
        const appSession = session as unknown as { user: AppUser };
        appSession.user = token.user as AppUser;
      }
      return session;
    },
  },
});
