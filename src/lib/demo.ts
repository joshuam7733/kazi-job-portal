/**
 * Prototype mode for client reviews (DEMO_MODE=true): shows a site-wide prototype banner and the demo
 * sign-in accounts, and asks search engines not to index anything. Never enable it for a real launch.
 */
export const demoMode = process.env.DEMO_MODE === "true";

export const DEMO_PASSWORD = "Kazi-demo-2026";

export const DEMO_ACCOUNTS = [
  { role: "Job seeker", email: "seeker@kazi.test", note: "Profile, applications, an interview and messages" },
  { role: "Employer", email: "employer@kazi.test", note: "Mwezi Software Labs — jobs and hiring pipeline" },
  { role: "Employer (unverified)", email: "owner@mpangaretail.test", note: "Verification pending" },
  { role: "Admin", email: "admin@kazi.test", note: "Moderation, analytics and settings" },
] as const;
