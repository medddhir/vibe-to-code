import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSafeReturnPath } from "@/lib/supabase/return-path";

const signInErrorUrl = (origin: string, reason: string): URL => {
  const url = new URL("/sign-in", origin);
  url.searchParams.set("error", reason);
  return url;
};

export const createOAuthCallbackRedirect = (url: URL): NextResponse =>
  NextResponse.redirect(url, {
    headers: {
      "Cache-Control":
        "private, no-cache, no-store, must-revalidate, max-age=0",
      Expires: "0",
      Pragma: "no-cache",
    },
  });

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const next = resolveSafeReturnPath(requestUrl.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "auth_unavailable"),
    );
  }

  if (!code) {
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "oauth_callback"),
    );
  }

  let exchange: Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>;

  try {
    exchange = await supabase.auth.exchangeCodeForSession(code);
  } catch {
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "oauth_callback"),
    );
  }

  if (exchange.error) {
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "oauth_callback"),
    );
  }

  let claims: Awaited<ReturnType<typeof supabase.auth.getClaims>>;

  try {
    claims = await supabase.auth.getClaims();
  } catch {
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "identity_verification"),
    );
  }

  if (claims.error || !claims.data?.claims?.sub) {
    await supabase.auth.signOut({ scope: "local" });
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "identity_verification"),
    );
  }

  return createOAuthCallbackRedirect(new URL(next, requestUrl.origin));
};
