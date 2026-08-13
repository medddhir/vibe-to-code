export type SupabasePublicConfig = {
  publishableKey: string;
  url: string;
};

export type SupabasePublicEnvironment = {
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
};

const readPublicEnvironment = (): SupabasePublicEnvironment => ({
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
});

const normalizeSupabaseUrl = (value: string): string | null => {
  try {
    const url = new URL(value);
    const localDevelopmentHost =
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "[::1]";

    if (
      (url.protocol !== "https:" && !(url.protocol === "http:" && localDevelopmentHost)) ||
      url.username ||
      url.password ||
      (url.pathname !== "/" && url.pathname !== "") ||
      url.search ||
      url.hash
    ) {
      return null;
    }

    return url.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
};

export const getSupabasePublicConfig = (
  environment: SupabasePublicEnvironment = readPublicEnvironment(),
): SupabasePublicConfig | null => {
  const publishableKey =
    environment.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const rawUrl = environment.NEXT_PUBLIC_SUPABASE_URL?.trim();

  if (!publishableKey || !rawUrl) {
    return null;
  }

  const url = normalizeSupabaseUrl(rawUrl);

  if (!url) {
    return null;
  }

  return { publishableKey, url };
};

export const isSupabaseConfigured = (
  environment?: SupabasePublicEnvironment,
): boolean => getSupabasePublicConfig(environment) !== null;

export const isProgressSyncEnabled = () =>
  process.env.NEXT_PUBLIC_PROGRESS_SYNC_ENABLED === "true";
