import type { AdminRole, Role } from "@prisma/client";

export type AdminPermission =
  | "users:manage"
  | "admins:manage"
  | "companies:verify"
  | "jobs:moderate"
  | "reports:review"
  | "taxonomy:manage"
  | "content:manage"
  | "announcements:send"
  | "settings:manage"
  | "analytics:view"
  | "audit:view";

const MATRIX: Record<AdminRole, AdminPermission[] | "*"> = {
  SUPER_ADMIN: "*",
  MODERATOR: ["companies:verify", "jobs:moderate", "reports:review", "users:manage", "analytics:view", "audit:view"],
  CONTENT_EDITOR: ["content:manage", "taxonomy:manage", "announcements:send", "analytics:view"],
  SUPPORT: ["users:manage", "reports:review", "analytics:view"],
};

export function adminCan(adminRole: AdminRole | null | undefined, permission: AdminPermission) {
  if (!adminRole) return false;
  const allowed = MATRIX[adminRole];
  return allowed === "*" || allowed.includes(permission);
}

export function permissionsFor(adminRole: AdminRole | null | undefined): AdminPermission[] {
  if (!adminRole) return [];
  const allowed = MATRIX[adminRole];
  if (allowed === "*")
    return [
      "users:manage",
      "admins:manage",
      "companies:verify",
      "jobs:moderate",
      "reports:review",
      "taxonomy:manage",
      "content:manage",
      "announcements:send",
      "settings:manage",
      "analytics:view",
      "audit:view",
    ];
  return allowed;
}

/** Where a signed-in user lands by default. */
export function homeForRole(role: Role) {
  if (role === "ADMIN") return "/admin";
  if (role === "EMPLOYER") return "/employer";
  return "/dashboard";
}
