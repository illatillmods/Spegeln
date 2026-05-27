import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendRoot, "..");
const schemaPath = existsSync(path.join(repoRoot, "prisma", "schema.prisma"))
  ? path.join(repoRoot, "prisma", "schema.prisma")
  : path.join(backendRoot, "prisma", "schema.prisma");

if (process.env.DATABASE_URL) {
  const migrate = spawnSync(
    "npx",
    ["prisma", "migrate", "deploy", "--schema", schemaPath],
    { cwd: repoRoot, stdio: "inherit", env: process.env },
  );

  if (migrate.status !== 0) {
    console.error("Prisma migrate deploy failed.");
    process.exit(migrate.status ?? 1);
  }
} else {
  console.warn("DATABASE_URL saknas — hoppar över migrate deploy.");
}

const server = spawnSync("node", [path.join(backendRoot, "dist", "index.js")], {
  cwd: backendRoot,
  stdio: "inherit",
  env: process.env,
});

process.exit(server.status ?? 1);
