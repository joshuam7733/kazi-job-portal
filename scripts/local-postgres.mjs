// Runs a real PostgreSQL server for local development without Docker or a system install.
// Data lives in ./.data/postgres. Stop with Ctrl+C.
import EmbeddedPostgres from "embedded-postgres";
import { existsSync } from "node:fs";
import path from "node:path";

const port = Number(process.env.LOCAL_PG_PORT ?? 5433);
const databaseDir = path.resolve(".data/postgres");

const pg = new EmbeddedPostgres({
  databaseDir,
  user: "kazi",
  password: "kazi",
  port,
  persistent: true,
});

if (!existsSync(path.join(databaseDir, "PG_VERSION"))) {
  console.log("Initialising local PostgreSQL cluster…");
  await pg.initialise();
}

await pg.start();
try {
  await pg.createDatabase("kazi");
} catch {
  // database already exists
}
try {
  await pg.createDatabase("kazi_test");
} catch {
  // database already exists
}

console.log(`PostgreSQL ready on postgresql://kazi:kazi@localhost:${port}/kazi`);

const shutdown = async () => {
  await pg.stop();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
setInterval(() => {}, 1 << 30);
