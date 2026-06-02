const PLACEHOLDER_VALUES = new Set([
  "",
  "https://example.supabase.co",
  "public-anon-key",
  "your-anon-key",
  "your-publishable-key",
  "https://your-project.supabase.co",
]);

export function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    "";

  return {
    url,
    publishableKey,
  };
}

export function isSupabaseConfigured() {
  const { url, publishableKey } = getSupabaseConfig();

  return !PLACEHOLDER_VALUES.has(url) && !PLACEHOLDER_VALUES.has(publishableKey);
}
