import "server-only";
import type { FilePurpose, FileVisibility } from "@prisma/client";
import { db } from "@/lib/db";
import { randomSuffix } from "@/lib/utils";
import { localDriver } from "./local";
import { databaseDriver } from "./database";
import { s3Driver } from "./s3";

export interface StorageDriver {
  put(key: string, data: Buffer, contentType: string): Promise<void>;
  get(key: string): Promise<Buffer | null>;
  delete(key: string): Promise<void>;
}

export function storage(): StorageDriver {
  if (process.env.STORAGE_DRIVER === "s3") return s3Driver();
  // Serverless hosts have no writable disk, so default to the database there.
  if (process.env.STORAGE_DRIVER === "database" || (!process.env.STORAGE_DRIVER && process.env.VERCEL)) return databaseDriver();
  return localDriver();
}

export const UPLOAD_RULES: Record<FilePurpose, { maxBytes: number; types: Record<string, string[]> }> = {
  RESUME: {
    maxBytes: 4 * 1024 * 1024,
    types: {
      "application/pdf": ["pdf"],
      "application/msword": ["doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ["docx"],
    },
  },
  VERIFICATION_DOC: {
    maxBytes: 4 * 1024 * 1024,
    types: { "application/pdf": ["pdf"], "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"] },
  },
  LOGO: {
    maxBytes: 1024 * 1024,
    types: { "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"], "image/webp": ["webp"] },
  },
  AVATAR: {
    maxBytes: 1024 * 1024,
    types: { "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"], "image/webp": ["webp"] },
  },
  ARTICLE_IMAGE: {
    maxBytes: 3 * 1024 * 1024,
    types: { "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"], "image/webp": ["webp"] },
  },
};

/** Inspect leading bytes so a renamed executable can't pass as a PDF or image. */
export function sniffMime(buf: Buffer): string | null {
  const hex = buf.subarray(0, 8).toString("hex");
  if (hex.startsWith("25504446")) return "application/pdf";
  if (hex.startsWith("89504e470d0a1a0a")) return "image/png";
  if (hex.startsWith("ffd8ff")) return "image/jpeg";
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return "image/webp";
  if (hex.startsWith("504b0304")) return "application/zip"; // docx container
  if (hex.startsWith("d0cf11e0a1b11ae1")) return "application/x-cfb"; // legacy .doc
  return null;
}

export class UploadError extends Error {}

export async function validateUpload(file: File, purpose: FilePurpose) {
  const rules = UPLOAD_RULES[purpose];
  if (!file || file.size === 0) throw new UploadError("Choose a file to upload.");
  if (file.size > rules.maxBytes)
    throw new UploadError(`That file is too large. The limit is ${Math.round(rules.maxBytes / 1024 / 1024)} MB.`);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const declared = Object.entries(rules.types).find(([, exts]) => exts.includes(ext))?.[0];
  if (!declared) throw new UploadError(`Upload a ${Object.values(rules.types).flat().join(", ").toUpperCase()} file.`);
  const buf = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffMime(buf);
  const ok =
    sniffed === declared ||
    (declared.includes("wordprocessingml") && sniffed === "application/zip") ||
    (declared === "application/msword" && sniffed === "application/x-cfb");
  if (!ok) throw new UploadError("That file's contents don't match its type. Export it again and retry.");
  return { buf, mimeType: declared, ext };
}

export async function saveUpload(opts: {
  file: File;
  purpose: FilePurpose;
  ownerId: string;
  visibility?: FileVisibility;
}) {
  const { buf, mimeType, ext } = await validateUpload(opts.file, opts.purpose);
  const key = `${opts.purpose.toLowerCase()}/${Date.now()}-${randomSuffix(12)}.${ext}`;
  await storage().put(key, buf, mimeType);
  return db.storedFile.create({
    data: {
      key,
      originalName: opts.file.name.slice(0, 200),
      mimeType,
      size: buf.length,
      purpose: opts.purpose,
      visibility: opts.visibility ?? (opts.purpose === "RESUME" || opts.purpose === "VERIFICATION_DOC" ? "PRIVATE" : "PUBLIC"),
      ownerId: opts.ownerId,
    },
  });
}

export async function deleteStoredFile(id: string) {
  const file = await db.storedFile.findUnique({ where: { id } });
  if (!file) return;
  await storage().delete(file.key).catch(() => undefined);
  await db.storedFile.delete({ where: { id } });
}

export function fileUrl(id: string) {
  return `/api/files/${id}`;
}
