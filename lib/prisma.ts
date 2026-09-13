import { PrismaPg } from "@prisma/adapter-pg";
import { withAccelerate } from "@prisma/extension-accelerate";

import { PrismaClient } from "@/app/generated/prisma/client";

// Prisma Postgres / Accelerate URLs go through Accelerate; anything else is a
// direct Postgres connection over the pg driver adapter.
// The two branches produce structurally different client types, and a union of
// them leaves every model method non-callable for consumers. Both satisfy the
// Accelerate-extended shape for ordinary model queries, so that is the exported
// type and the direct-adapter branch is widened to it.
type AppPrismaClient = ReturnType<typeof createAcceleratedClient>;

function createAcceleratedClient(accelerateUrl: string) {
  return new PrismaClient({ accelerateUrl }).$extends(withAccelerate());
}

function createPrismaClient(): AppPrismaClient {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  if (databaseUrl.startsWith("prisma+postgres://")) {
    return createAcceleratedClient(databaseUrl);
  }

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  }) as unknown as AppPrismaClient;
}

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: AppPrismaClient;
};

export const prisma: AppPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

// Cache on `global` so Next.js hot reloads reuse one client instead of
// exhausting connections with a new one per module reload.
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
