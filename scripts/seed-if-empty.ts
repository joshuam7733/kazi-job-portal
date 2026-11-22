/* Loads the sample data on the first deploy of an empty database (used by the Vercel build).
   Never touches a database that already has jobs, so redeploys keep everything people changed. */
import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";

async function main() {
  const db = new PrismaClient();
  const jobs = await db.job.count();
  await db.$disconnect();
  if (jobs > 0) {
    console.log(`[seed-if-empty] Database already has ${jobs} jobs; skipping sample data.`);
    return;
  }
  console.log("[seed-if-empty] Empty database; loading sample data...");
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
