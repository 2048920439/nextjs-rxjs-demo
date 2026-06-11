import NextAuth from "next-auth";

import type { User as AppUser } from "@/shared/types/auth";

declare module "next-auth" {
  interface User {
    createdAt: number;
  }

  interface Session {
    user: AppUser;
  }
}

export const { handlers, auth } = NextAuth({
  secret: process.env.AUTH_SECRET ?? process.env.JWT_SECRET,
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [],
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
