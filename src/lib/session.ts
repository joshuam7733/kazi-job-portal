import "server-only";
import { redirect } from "next/navigation";
import { cache } from "react";
import type { Role } from "@prisma/client";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { adminCan, type AdminPermission } from "@/lib/permissions";

export class AuthError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "AuthError";
  }
}

/** Current session user (or null). Cached per request. */
export const getSessionUser = cache(async () => {
  const session = await auth();
  return session?.user ?? null;
});

/** Full DB user for the current session. */
export const getCurrentUser = cache(async () => {
  const user = await getSessionUser();
  if (!user) return null;
  return db.user.findUnique({ where: { id: user.id } });
});

/** For pages: redirect to sign-in when signed out, home when role mismatches. */
export async function requirePageUser(roles?: Role[], callbackUrl?: string) {
  const user = await getSessionUser();
  if (!user) redirect(`/signin${callbackUrl ? `?callbackUrl=${encodeURIComponent(callbackUrl)}` : ""}`);
  if (roles && !roles.includes(user.role)) redirect("/forbidden");
  return user;
}

/** For server actions / route handlers: throw instead of redirecting. */
export async function requireUser(roles?: Role[]) {
  const user = await getSessionUser();
  if (!user) throw new AuthError("Sign in to continue.");
  if (roles && !roles.includes(user.role)) throw new AuthError();
  return user;
}

export async function requireAdmin(permission: AdminPermission) {
  const user = await requireUser(["ADMIN"]);
  if (!adminCan(user.adminRole, permission)) throw new AuthError();
  return user;
}

export async function requireAdminPage(permission: AdminPermission) {
  const user = await requirePageUser(["ADMIN"]);
  if (!adminCan(user.adminRole, permission)) redirect("/forbidden");
  return user;
}

/** The employer's company (with membership check). */
export async function requireEmployerCompany() {
  const user = await requireUser(["EMPLOYER"]);
  const profile = await db.employerProfile.findUnique({ where: { userId: user.id }, include: { company: true } });
  if (!profile?.company) throw new AuthError("Set up your company profile first.");
  if (profile.company.isSuspended) throw new AuthError("This company account is suspended. Contact support.");
  return { user, profile, company: profile.company };
}
