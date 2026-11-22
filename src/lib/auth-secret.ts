import { createHash } from "node:crypto";

/**
 * Auth.js signing secret. Uses AUTH_SECRET when set; otherwise (zero-config preview deploys) derives a
 * stable secret from the private database connection string, so no secret has to be entered by hand.
 */
export const authSecret =
  process.env.AUTH_SECRET ||
  (process.env.DATABASE_URL ? createHash("sha256").update(`kazi-auth-secret:${process.env.DATABASE_URL}`).digest("base64") : undefined);
