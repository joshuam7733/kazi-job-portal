import bcrypt from "bcryptjs";

const ROUNDS = 12;

export function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

export function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

// Used to keep sign-in timing similar whether or not the email exists.
const DUMMY_HASH = "$2b$12$C6UzMDM.H6dfI/f/IKcEeO5uR1vXy9yYw9.yQ0pB0Yb7Fz6mXJ6aW";
export async function burnPasswordCheck(password: string) {
  await bcrypt.compare(password, DUMMY_HASH).catch(() => false);
}
