import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createPrismaClient() {
  return new PrismaClient({
    adapter: createMariaDbAdapter(),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });
}

function createMariaDbAdapter() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error("DATABASE_URL belum disetel.");
  }

  const parsedUrl = new URL(databaseUrl);
  const allowPublicKeyRetrieval = parsedUrl.searchParams.get("allowPublicKeyRetrieval") === "true";

  return new PrismaMariaDb({
    host: parsedUrl.hostname,
    port: Number(parsedUrl.port || 3306),
    user: decodeURIComponent(parsedUrl.username),
    password: decodeURIComponent(parsedUrl.password),
    database: parsedUrl.pathname.replace(/^\//, ""),
    allowPublicKeyRetrieval,
  });
}

const cachedPrisma = globalForPrisma.prisma;
const hasRecurringTaskDelegate =
  cachedPrisma && "recurringTask" in (cachedPrisma as PrismaClient & { recurringTask?: unknown });
const hasTaskWorkLogDelegate =
  cachedPrisma && "taskWorkLog" in (cachedPrisma as PrismaClient & { taskWorkLog?: unknown });

export const db = hasRecurringTaskDelegate && hasTaskWorkLogDelegate ? cachedPrisma : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
