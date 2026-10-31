import type { NextAuthConfig } from "next-auth";
import type { AdminRole, Role } from "@prisma/client";

/**
 * Edge-safe Auth.js configuration shared by the proxy (route protection) and the full server config.
 * Must not import Prisma or Node-only modules.
 */
export const authConfig = {
  pages: { signIn: "/signin", error: "/signin" },
  session: { strategy: "jwt", maxAge: 60 * 60 * 24 * 14 },
  providers: [],
  callbacks: {
    session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
        session.user.role = token.role as Role;
        session.user.adminRole = (token.adminRole as AdminRole | null) ?? null;
        session.user.onboarded = Boolean(token.onboarded);
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
