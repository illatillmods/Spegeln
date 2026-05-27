import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const sourceSchemaPath = path.resolve(backendRoot, "..", "prisma", "schema.prisma");
const targetSchemaPath = path.resolve(backendRoot, "prisma", "schema.prisma");

await mkdir(path.dirname(targetSchemaPath), { recursive: true });
await writeFile(targetSchemaPath, await readFile(sourceSchemaPath, "utf8"));