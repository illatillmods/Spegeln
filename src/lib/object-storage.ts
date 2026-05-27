import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const uploadRoot = process.env.EVIDENCE_UPLOAD_DIR || path.join(process.cwd(), ".uploads");

type S3Config = {
  bucket: string;
  endpoint?: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  publicUrl?: string;
};

function getS3Config(): S3Config | null {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY;
  const secretAccessKey = process.env.S3_SECRET_KEY;

  if (!bucket || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return {
    bucket,
    endpoint: process.env.S3_ENDPOINT || undefined,
    region: process.env.S3_REGION || "auto",
    accessKeyId,
    secretAccessKey,
    publicUrl: process.env.S3_PUBLIC_URL || undefined,
  };
}

function parseStorageKey(storageKey: string) {
  if (storageKey.startsWith("s3://")) {
    const withoutScheme = storageKey.slice("s3://".length);
    const slashIndex = withoutScheme.indexOf("/");
    if (slashIndex === -1) {
      return null;
    }

    return {
      bucket: withoutScheme.slice(0, slashIndex),
      key: withoutScheme.slice(slashIndex + 1),
    };
  }

  if (storageKey.startsWith("file://")) {
    return { localPath: storageKey.slice("file://".length) };
  }

  return null;
}

async function getS3Client(config: S3Config) {
  const { S3Client } = await import("@aws-sdk/client-s3");
  return new S3Client({
    region: config.region,
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey,
    },
    forcePathStyle: Boolean(config.endpoint),
  });
}

export async function storeEvidenceFile(fileName: string, buffer: Buffer, mimeType: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]+/g, "_");
  const key = `evidence/${Date.now()}-${randomUUID()}-${safeName}`;
  const s3Config = getS3Config();

  if (s3Config) {
    const client = await getS3Client(s3Config);
    const { PutObjectCommand } = await import("@aws-sdk/client-s3");
    await client.send(
      new PutObjectCommand({
        Bucket: s3Config.bucket,
        Key: key,
        Body: buffer,
        ContentType: mimeType,
      }),
    );

    return {
      storageKey: `s3://${s3Config.bucket}/${key}`,
      byteSize: buffer.byteLength,
      mimeType,
      fileName,
    };
  }

  await mkdir(uploadRoot, { recursive: true });
  const localKey = `${Date.now()}-${randomUUID()}-${safeName}`;
  const absolutePath = path.join(uploadRoot, localKey);
  await writeFile(absolutePath, buffer);

  return {
    storageKey: `file://${absolutePath}`,
    byteSize: buffer.byteLength,
    mimeType,
    fileName,
  };
}

export function resolvePublicStorageUrl(storageKey: string) {
  const parsed = parseStorageKey(storageKey);
  const s3Config = getS3Config();

  if (parsed && "bucket" in parsed && parsed.bucket && parsed.key && s3Config?.publicUrl) {
    return `${s3Config.publicUrl.replace(/\/$/, "")}/${parsed.key}`;
  }

  if (storageKey.startsWith("file://")) {
    return storageKey;
  }

  if (storageKey.startsWith("pending://")) {
    return null;
  }

  return storageKey;
}

export async function resolveEvidenceAccessUrl(storageKey: string, expiresInSeconds = 3600) {
  const parsed = parseStorageKey(storageKey);
  const s3Config = getS3Config();

  if (parsed && "bucket" in parsed && parsed.bucket && parsed.key) {
    const publicUrl = resolvePublicStorageUrl(storageKey);
    if (publicUrl && !publicUrl.startsWith("s3://")) {
      return publicUrl;
    }

    if (s3Config) {
      const client = await getS3Client(s3Config);
      const { GetObjectCommand } = await import("@aws-sdk/client-s3");
      const { getSignedUrl } = await import("@aws-sdk/s3-request-presigner");
      return getSignedUrl(
        client,
        new GetObjectCommand({
          Bucket: parsed.bucket,
          Key: parsed.key,
        }),
        { expiresIn: expiresInSeconds },
      );
    }
  }

  if (parsed && "localPath" in parsed && parsed.localPath) {
    return null;
  }

  return null;
}

export async function readEvidenceBuffer(storageKey: string) {
  const parsed = parseStorageKey(storageKey);

  if (parsed && "localPath" in parsed && parsed.localPath) {
    return readFile(parsed.localPath);
  }

  if (parsed && "bucket" in parsed && parsed.bucket && parsed.key) {
    const s3Config = getS3Config();
    if (!s3Config) {
      throw new Error("S3 är inte konfigurerat.");
    }

    const client = await getS3Client(s3Config);
    const { GetObjectCommand } = await import("@aws-sdk/client-s3");
    const response = await client.send(
      new GetObjectCommand({
        Bucket: parsed.bucket,
        Key: parsed.key,
      }),
    );
    const body = response.Body;

    if (!body) {
      throw new Error("Tom fil från objektlagring.");
    }

    return Buffer.from(await body.transformToByteArray());
  }

  throw new Error("Okänd lagringsnyckel.");
}
