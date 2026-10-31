/* Creates the first super admin and prints a one-time password-setup link.
   Usage: npx tsx scripts/create-admin.ts "Full Name" email@example.com */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "node:crypto";

const [name, emailArg] = process.argv.slice(2);
if (!name || !emailArg) {
  console.error('Usage: npx tsx scripts/create-admin.ts "Full Name" email@example.com');
  process.exit(1);
}
const email = emailArg.trim().toLowerCase();
const db = new PrismaClient();

const existing = await db.user.findUnique({ where: { email } });
if (existing) {
  console.error(`An account already exists for ${email}.`);
  process.exit(1);
}
await db.user.create({
  data: { name, email, role: "ADMIN", adminRole: "SUPER_ADMIN", passwordHash: await bcrypt.hash(randomBytes(32).toString("hex"), 12), onboardedAt: new Date() },
});
const token = randomBytes(32).toString("base64url");
await db.authToken.create({
  data: { email, purpose: "reset-password", tokenHash: createHash("sha256").update(token).digest("hex"), expires: new Date(Date.now() + 48 * 3_600_000) },
});
const base = (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
console.log(`Super admin created for ${email}.`);
console.log(`Set the password within 48 hours: ${base}/reset-password?token=${token}`);
await db.$disconnect();
