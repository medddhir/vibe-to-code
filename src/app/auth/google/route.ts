import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicConfig } from "@/lib/supabase/config";
import { resolveSafeReturnPath } from "@/lib/supabase/return-path";

type OAuthIntent = "sign-in" | "sign-up";

type PendingCookie = {
  name: string;
  options: CookieOptions;
  value: string;
};

export const getOAuthStartParams = (url: URL) => {
  const intent: OAuthIntent =
    url.searchParams.get("intent") === "sign-up" ? "sign-up" : "sign-in";
  const next = resolveSafeReturnPath(
    url.searchParams.get("next"),
    intent === "sign-up" ? "/courses/foundations" : "/learn",
  );

  return { intent, next };
};

const signInErrorRedirect = (origin: string, reason: string) => {
  const url = new URL("/sign-in", origin);
  url.searchParams.set("error", reason);
  return NextResponse.redirect(url);
};

const createOAuthStartClient = async () => {
  const config = getSupabasePublicConfig();

  if (!config) {
    return null;
  }

  const cookieStore = await cookies();
  const pendingCookies: PendingCookie[] = [];

  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        pendingCookies.push(...cookiesToSet);
      },
    },
  });

  return { pendingCookies, supabase };
};

const applyPendingCookies = (
  response: NextResponse,
  pendingCookies: PendingCookie[],
): NextResponse => {
  pendingCookies.forEach(({ name, options, value }) => {
    response.cookies.set(name, value, options);
  });

  return response;
};

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const requestUrl = request.nextUrl;
  const { intent, next } = getOAuthStartParams(requestUrl);
  const auth = await createOAuthStartClient();

  if (!auth) {
    return signInErrorRedirect(requestUrl.origin, "auth_unavailable");
  }

  const callbackUrl = new URL("/auth/callback", requestUrl.origin);
  callbackUrl.searchParams.set(
    "next",
    intent === "sign-up" ? "/account/welcome" : next,
  );

  const { data, error } = await auth.supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return signInErrorRedirect(requestUrl.origin, "oauth_start");
  }

  const response = NextResponse.redirect(data.url, {
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
      Expires: "0",
      Pragma: "no-cache",
    },
  });

  return applyPendingCookies(response, auth.pendingCookies);
};
