import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db";

export type TokenPurpose = "verify-email" | "reset-password";

const hash = (t: string) => createHash("sha256").update(t).digest("hex");

export async function createAuthToken(email: string, purpose: TokenPurpose, ttlMinutes: number) {
  const token = randomBytes(32).toString("base64url");
  await db.authToken.deleteMany({ where: { email, purpose } });
  await db.authToken.create({
    data: { email, purpose, tokenHash: hash(token), expires: new Date(Date.now() + ttlMinutes * 60_000) },
  });
  return token;
}

/** Returns the email if the token is valid, marking it used. */
export async function consumeAuthToken(token: string, purpose: TokenPurpose) {
  const row = await db.authToken.findUnique({ where: { tokenHash: hash(token) } });
  if (!row || row.purpose !== purpose || row.usedAt || row.expires < new Date()) return null;
  await db.authToken.update({ where: { id: row.id }, data: { usedAt: new Date() } });
  return row.email;
}

export async function peekAuthToken(token: string, purpose: TokenPurpose) {
  const row = await db.authToken.findUnique({ where: { tokenHash: hash(token) } });
  return Boolean(row && row.purpose === purpose && !row.usedAt && row.expires > new Date());
}
