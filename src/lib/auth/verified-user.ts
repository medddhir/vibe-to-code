import type { SupabaseClient, User } from "@supabase/supabase-js";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type VerifiedAuthResult =
  | {
      ok: true;
      supabase: SupabaseClient;
      user: User;
    }
  | {
      ok: false;
      reason: "auth-unavailable" | "unauthenticated" | "unverified-email";
    };

export async function getVerifiedAuth(): Promise<VerifiedAuthResult> {
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return { ok: false, reason: "auth-unavailable" };
  }

  let verification: Awaited<ReturnType<typeof supabase.auth.getUser>>;

  try {
    verification = await supabase.auth.getUser();
  } catch {
    return { ok: false, reason: "auth-unavailable" };
  }

  const { data, error } = verification;

  if (error || !data.user) {
    return { ok: false, reason: "unauthenticated" };
  }

  if (!data.user.email || !data.user.email_confirmed_at) {
    return { ok: false, reason: "unverified-email" };
  }

  return { ok: true, supabase, user: data.user };
}
