import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL!;

  // Parse the connection URL to extract explicit parameters.
  // This avoids SASL auth failures caused by special characters
  // (like '$') in the password being mishandled during URL parsing.
  const url = new URL(connectionString);
  const sslMode = url.searchParams.get("sslmode");
  const useSSL = sslMode !== "disable";
  
  const adapter = new PrismaPg({
    host: url.hostname,
    port: parseInt(url.port || "5432", 10),
    database: url.pathname.slice(1),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    ssl: useSSL ? { rejectUnauthorized: false } : false,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
    query_timeout: 10000,
  });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;


