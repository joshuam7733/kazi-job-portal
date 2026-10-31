import type { AdminRole, Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
      adminRole: AdminRole | null;
      onboarded: boolean;
    } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
    adminRole?: AdminRole | null;
    sessionVersion?: number;
    onboardedAt?: Date | null;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    role?: Role;
    adminRole?: AdminRole | null;
    sv?: number;
    onboarded?: boolean;
    checkedAt?: number;
  }
}
