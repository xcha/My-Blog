import "server-only";

import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    // Prisma v7 关键：必须提供 adapter（Postgres 用 PrismaPg）
    adapter: new PrismaPg({
      connectionString: process.env.DATABASE_URL!,
    }),
    // 可选：调试时再打开
    // log: ["query", "error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
