import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaPool?: Pool;
};

export function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    return null;
  }

  if (!globalForPrisma.prisma) {
    const pool = globalForPrisma.prismaPool ?? new Pool({ connectionString: process.env.DATABASE_URL });
    const adapter = new PrismaPg(pool);

    globalForPrisma.prismaPool = pool;
    globalForPrisma.prisma = new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
  }

  return globalForPrisma.prisma;
}