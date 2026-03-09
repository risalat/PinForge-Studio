const cwdStorage = `${process.cwd()}/storage`;

export const env = {
  databaseUrl: process.env.DATABASE_URL,
  storageProvider: process.env.STORAGE_PROVIDER ?? "local",
  localStoragePath: process.env.LOCAL_STORAGE_PATH ?? cwdStorage,
  appEncryptionKey: process.env.APP_ENCRYPTION_KEY ?? "",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? "",
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
