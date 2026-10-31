import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { burnPasswordCheck, verifyPassword } from "@/lib/password";
import { rateLimit } from "@/lib/rate-limit";
import { signInSchema } from "@/lib/validation/auth";

class InvalidLogin extends CredentialsSignin {
  code = "invalid_credentials";
}
class TooManyAttempts extends CredentialsSignin {
  code = "rate_limited";
}
class Suspended extends CredentialsSignin {
  code = "suspended";
}

export const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);

// How often the JWT re-checks the database for role changes, suspension or revoked sessions.
const RECHECK_MS = 60_000;

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(db),
  providers: [
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(raw, request) {
        const parsed = signInSchema.safeParse(raw);
        if (!parsed.success) throw new InvalidLogin();
        const email = parsed.data.email.toLowerCase();
        const ip = request?.headers?.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
        if (!rateLimit(`signin:${ip}`, 20, 15 * 60_000).ok || !rateLimit(`signin:${email}`, 8, 15 * 60_000).ok) {
          throw new TooManyAttempts();
        }
        const user = await db.user.findUnique({ where: { email } });
        if (!user?.passwordHash) {
          await burnPasswordCheck(parsed.data.password);
          throw new InvalidLogin();
        }
        const valid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!valid) throw new InvalidLogin();
        if (user.status === "SUSPENDED") throw new Suspended();
        await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          adminRole: user.adminRole,
          sessionVersion: user.sessionVersion,
          onboardedAt: user.onboardedAt,
        };
      },
    }),
    ...(googleEnabled ? [Google({ allowDangerousEmailAccountLinking: false })] : []),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger }) {
      if (user) {
        // Fresh sign-in (credentials or OAuth): load authoritative values.
        const dbUser = await db.user.findUnique({ where: { id: user.id! } });
        if (!dbUser || dbUser.status === "SUSPENDED") return null;
        token.role = dbUser.role;
        token.adminRole = dbUser.adminRole;
        token.sv = dbUser.sessionVersion;
        token.onboarded = Boolean(dbUser.onboardedAt);
        token.checkedAt = Date.now();
        return token;
      }
      if (trigger === "update" || !token.checkedAt || Date.now() - token.checkedAt > RECHECK_MS) {
        const dbUser = await db.user.findUnique({
          where: { id: token.sub! },
          select: { role: true, adminRole: true, sessionVersion: true, status: true, onboardedAt: true, name: true },
        });
        // Deleted, suspended or "signed out everywhere" → invalidate this session.
        if (!dbUser || dbUser.status === "SUSPENDED" || dbUser.sessionVersion !== token.sv) return null;
        token.role = dbUser.role;
        token.adminRole = dbUser.adminRole;
        token.onboarded = Boolean(dbUser.onboardedAt);
        token.name = dbUser.name;
        token.checkedAt = Date.now();
      }
      return token;
    },
  },
  events: {
    async linkAccount({ user }) {
      // OAuth providers verify the email address.
      await db.user.update({ where: { id: user.id! }, data: { emailVerified: new Date() } });
    },
  },
});
