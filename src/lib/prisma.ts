import { PrismaClient } from "@prisma/client";

declare global {
  var __pinforgePrisma: PrismaClient | undefined;
}

const prismaDatasourceUrl = resolvePrismaDatasourceUrl();

export const prisma =
  global.__pinforgePrisma ??
  new PrismaClient({
    datasourceUrl: prismaDatasourceUrl,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__pinforgePrisma = prisma;
}

function resolvePrismaDatasourceUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    return undefined;
  }

  let parsed: URL;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    return databaseUrl;
  }

  const isSupabasePooler = parsed.hostname.endsWith(".pooler.supabase.com");
  if (!isSupabasePooler) {
    return databaseUrl;
  }

  if (isServerlessRuntime() && parsed.port === "5432") {
    parsed.port = "6543";
    console.warn(
      "Prisma runtime switched Supabase pooler traffic from session mode (:5432) to transaction mode (:6543) for a serverless deployment.",
    );
  }

  if (parsed.port === "6543" && parsed.searchParams.get("pgbouncer") !== "true") {
    parsed.searchParams.set("pgbouncer", "true");
  }

  if (isServerlessRuntime() && parsed.port === "6543" && !parsed.searchParams.has("connection_limit")) {
    parsed.searchParams.set("connection_limit", "1");
  }

  return parsed.toString();
}

function isServerlessRuntime() {
  return Boolean(
    process.env.VERCEL ||
      process.env.AWS_EXECUTION_ENV ||
      process.env.AWS_LAMBDA_FUNCTION_NAME ||
      process.env.LAMBDA_TASK_ROOT,
  );
}
