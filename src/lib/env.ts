const cwdStorage = `${process.cwd()}/storage`;
const hasR2Config = Boolean(
  process.env.R2_BUCKET_NAME &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    (process.env.R2_ENDPOINT || process.env.R2_ACCOUNT_ID),
);

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  storageProvider: process.env.STORAGE_PROVIDER ?? (hasR2Config ? "r2" : "local"),
  localStoragePath: process.env.LOCAL_STORAGE_PATH ?? cwdStorage,
  appEncryptionKey: process.env.APP_ENCRYPTION_KEY ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
  r2AccountId: process.env.R2_ACCOUNT_ID ?? "",
  r2Endpoint: process.env.R2_ENDPOINT ?? "",
  r2BucketName: process.env.R2_BUCKET_NAME ?? "",
  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  r2PublicBaseUrl: process.env.R2_PUBLIC_BASE_URL ?? "",
  appUrl:
    process.env.APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://127.0.0.1:3000",
};

export function isDatabaseConfigured() {
  return Boolean(env.databaseUrl);
}

export function isSupabaseAuthConfigured() {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}

export function isR2Configured() {
  return Boolean(
    env.r2BucketName &&
      env.r2AccessKeyId &&
      env.r2SecretAccessKey &&
      (env.r2Endpoint || env.r2AccountId),
  );
}
