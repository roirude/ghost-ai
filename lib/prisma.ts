import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

import { PrismaClient } from "@/app/generated/prisma/client";

// Prisma Postgres / Accelerate URLs go through Accelerate; anything else is a
// direct Postgres connection over the pg driver adapter.
function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (databaseUrl.startsWith("prisma+postgres://")) {
    return new PrismaClient({ accelerateUrl: databaseUrl }).$extends(
      withAccelerate(),
    );
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
}

type CachedPrismaClient = ReturnType<typeof createPrismaClient>;

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: CachedPrismaClient;
};

export const prisma: CachedPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

// Cache on `global` so Next.js hot reloads reuse one client instead of
// exhausting connections with a new one per module reload.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
