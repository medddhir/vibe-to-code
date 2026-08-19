import { type NextRequest, NextResponse } from "next/server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { resolveSafeReturnPath } from "@/lib/supabase/return-path";

type OAuthIntent = "sign-in" | "sign-up";

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

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const requestUrl = request.nextUrl;
  const { intent, next } = getOAuthStartParams(requestUrl);
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return signInErrorRedirect(requestUrl.origin, "auth_unavailable");
  }

  const callbackUrl = new URL("/auth/callback", requestUrl.origin);
  callbackUrl.searchParams.set(
    "next",
    intent === "sign-up" ? "/account/welcome" : next,
  );

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: true,
    },
  });

  if (error || !data.url) {
    return signInErrorRedirect(requestUrl.origin, "oauth_start");
  }

  return NextResponse.redirect(data.url, {
    headers: {
      "Cache-Control": "private, no-cache, no-store, must-revalidate, max-age=0",
      Expires: "0",
      Pragma: "no-cache",
    },
  });
};
