"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";

import { getSupabasePublicConfig } from "@/lib/supabase/config";

let browserClient: SupabaseClient | null | undefined;

export const createClient = (): SupabaseClient | null => {
  if (browserClient !== undefined) {
    return browserClient;
  }

  const config = getSupabasePublicConfig();

  if (!config) {
    browserClient = null;
    return browserClient;
  }

  browserClient = createBrowserClient(config.url, config.publishableKey);
  return browserClient;
};
