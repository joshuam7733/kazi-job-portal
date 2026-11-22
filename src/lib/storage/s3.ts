import { AwsClient } from "aws4fetch";
import type { StorageDriver } from "./index";

/** S3-compatible driver (AWS S3, Cloudflare R2, MinIO, Backblaze B2). Objects stay private. */
export function s3Driver(): StorageDriver {
  const { S3_ENDPOINT, S3_REGION, S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY } = process.env;
  if (!S3_ENDPOINT || !S3_BUCKET || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY) {
    throw new Error("STORAGE_DRIVER=s3 requires S3_ENDPOINT, S3_BUCKET, S3_ACCESS_KEY_ID and S3_SECRET_ACCESS_KEY");
  }
  const client = new AwsClient({
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
    region: S3_REGION || "auto",
    service: "s3",
  });
  const url = (key: string) => `${S3_ENDPOINT.replace(/\/$/, "")}/${S3_BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;

  return {
    async put(key, data, contentType) {
      const res = await client.fetch(url(key), {
        method: "PUT",
        body: new Uint8Array(data),
        headers: { "Content-Type": contentType },
      });
      if (!res.ok) throw new Error(`S3 upload failed (${res.status})`);
    },
    async get(key) {
      const res = await client.fetch(url(key));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error(`S3 download failed (${res.status})`);
      return Buffer.from(await res.arrayBuffer());
    },
    async delete(key) {
      await client.fetch(url(key), { method: "DELETE" });
    },
  };
}
