import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageDriver } from "./index";

const ROOT = path.resolve(process.cwd(), "storage", "uploads");

function resolveKey(key: string) {
  const full = path.resolve(ROOT, key);
  if (!full.startsWith(ROOT + path.sep)) throw new Error("Invalid storage key");
  return full;
}

/** Stores files outside /public so they are only reachable through the authorised file route. */
export function localDriver(): StorageDriver {
  return {
    async put(key, data) {
      const full = resolveKey(key);
      await mkdir(path.dirname(full), { recursive: true });
      await writeFile(full, data);
    },
    async get(key) {
      try {
        return await readFile(resolveKey(key));
      } catch {
        return null;
      }
    },
    async delete(key) {
      await rm(resolveKey(key), { force: true });
    },
  };
}
