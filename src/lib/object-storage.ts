import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadRoot = process.env.EVIDENCE_UPLOAD_DIR || path.join(process.cwd(), ".uploads");

export async function storeEvidenceFile(fileName: string, buffer: Buffer, mimeType: string) {
  await mkdir(uploadRoot, { recursive: true });
  const key = `${Date.now()}-${randomUUID()}-${fileName.replace(/[^a-zA-Z0-9._-]+/g, "_")}`;
  const absolutePath = path.join(uploadRoot, key);
  await writeFile(absolutePath, buffer);

  return {
    storageKey: `file://${absolutePath}`,
    byteSize: buffer.byteLength,
    mimeType,
    fileName,
  };
}

export function resolvePublicStorageUrl(storageKey: string) {
  if (storageKey.startsWith("file://")) {
    return storageKey;
  }

  if (storageKey.startsWith("pending://")) {
    return null;
  }

  return storageKey;
}
