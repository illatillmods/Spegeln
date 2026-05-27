import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const monorepoSchemaPath = path.resolve(backendRoot, "..", "prisma", "schema.prisma");
const targetSchemaPath = path.resolve(backendRoot, "prisma", "schema.prisma");

async function fileExists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

await mkdir(path.dirname(targetSchemaPath), { recursive: true });

if (await fileExists(monorepoSchemaPath)) {
  await writeFile(targetSchemaPath, await readFile(monorepoSchemaPath, "utf8"));
  console.log(`Synced Prisma schema from ${monorepoSchemaPath}`);
} else if (await fileExists(targetSchemaPath)) {
  console.log(`Using existing Prisma schema at ${targetSchemaPath}`);
} else {
  throw new Error(
    "Prisma schema not found. Set Railway Root Directory to the repository root (not backend/), or commit backend/prisma/schema.prisma.",
  );
}
