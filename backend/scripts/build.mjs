import { build } from "esbuild";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(backendRoot, "..");
const srcRoot = path.join(repoRoot, "src");

function resolveTypeScriptModule(targetPath) {
  const candidates = [
    targetPath,
    `${targetPath}.ts`,
    `${targetPath}.tsx`,
    path.join(targetPath, "index.ts"),
    path.join(targetPath, "index.tsx"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return targetPath;
}

const aliasPlugin = {
  name: "spegeln-alias",
  setup(buildContext) {
    buildContext.onResolve({ filter: /^@\// }, (args) => ({
      path: resolveTypeScriptModule(path.join(srcRoot, args.path.slice(2))),
    }));

    buildContext.onResolve({ filter: /^next\/cache$/ }, () => ({
      path: path.join(backendRoot, "src", "shims", "next-cache.ts"),
    }));
  },
};

await build({
  entryPoints: [path.join(backendRoot, "src", "index.ts")],
  outfile: path.join(backendRoot, "dist", "index.js"),
  absWorkingDir: backendRoot,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  sourcemap: true,
  nodePaths: [path.join(backendRoot, "node_modules")],
  external: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "bcryptjs",
    "jose",
    "nodemailer",
    "pg",
    "stripe",
  ],
  plugins: [aliasPlugin],
  define: {
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "production"),
  },
  logLevel: "info",
});