import { db } from "@/lib/db";
import type { StorageDriver } from "./index";

/**
 * Stores file bytes in PostgreSQL. Meant for small prototypes on serverless hosts (no persistent disk,
 * no bucket). Use the S3 driver for production volumes.
 */
export function databaseDriver(): StorageDriver {
  return {
    async put(key, data) {
      await db.fileBlob.upsert({ where: { key }, create: { key, data: new Uint8Array(data) }, update: { data: new Uint8Array(data) } });
    },
    async get(key) {
      const row = await db.fileBlob.findUnique({ where: { key } });
      return row ? Buffer.from(row.data) : null;
    },
    async delete(key) {
      await db.fileBlob.deleteMany({ where: { key } });
    },
  };
}
