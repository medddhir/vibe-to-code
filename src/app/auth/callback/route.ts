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

export const getOAuthFlowOptions = (
  url: URL,
): { flowId: string } | undefined => {
  const flowId = url.searchParams.get("sb_flow_id")?.trim();
  return flowId ? { flowId } : undefined;
};

export const hasOAuthVerifierCookie = (request: NextRequest): boolean =>
  request.cookies
    .getAll()
    .some(({ name }) => name.endsWith("-auth-token-code-verifier"));

const safeOAuthErrorMessage = (message?: string): string | undefined => {
  if (!message) {
    return undefined;
  }

  return message.replace(/[A-Za-z0-9_-]{24,}/g, "[redacted]").slice(0, 180);
};

const logOAuthCallbackFailure = (
  stage:
    | "missing_code"
    | "exchange_threw"
    | "exchange_rejected"
    | "claims_threw"
    | "claims_rejected",
  details: {
    hasFlowId: boolean;
    hasVerifierCookie: boolean;
    errorCode?: string;
    errorMessage?: string;
    errorName?: string;
    errorStatus?: number;
  },
) => {
  // Never log the OAuth code, PKCE verifier, session tokens, or user identity.
  console.error("oauth_callback_failure", { stage, ...details });
};

export const GET = async (request: NextRequest): Promise<NextResponse> => {
  const requestUrl = request.nextUrl;
  const code = requestUrl.searchParams.get("code");
  const flowOptions = getOAuthFlowOptions(requestUrl);
  const hasVerifierCookie = hasOAuthVerifierCookie(request);
  const next = resolveSafeReturnPath(requestUrl.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();

  if (!supabase) {
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "auth_unavailable"),
    );
  }

  if (!code) {
    logOAuthCallbackFailure("missing_code", {
      hasFlowId: Boolean(flowOptions),
      hasVerifierCookie,
    });
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "oauth_callback"),
    );
  }

  let exchange: Awaited<ReturnType<typeof supabase.auth.exchangeCodeForSession>>;

  try {
    exchange = await supabase.auth.exchangeCodeForSession(code, flowOptions);
  } catch (error) {
    logOAuthCallbackFailure("exchange_threw", {
      hasFlowId: Boolean(flowOptions),
      hasVerifierCookie,
      errorMessage: safeOAuthErrorMessage(
        error instanceof Error ? error.message : undefined,
      ),
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "oauth_callback"),
    );
  }

  if (exchange.error) {
    logOAuthCallbackFailure("exchange_rejected", {
      hasFlowId: Boolean(flowOptions),
      hasVerifierCookie,
      errorCode: exchange.error.code,
      errorMessage: safeOAuthErrorMessage(exchange.error.message),
      errorName: exchange.error.name,
      errorStatus: exchange.error.status,
    });
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "oauth_callback"),
    );
  }

  let claims: Awaited<ReturnType<typeof supabase.auth.getClaims>>;

  try {
    claims = await supabase.auth.getClaims();
  } catch (error) {
    logOAuthCallbackFailure("claims_threw", {
      hasFlowId: Boolean(flowOptions),
      hasVerifierCookie,
      errorMessage: safeOAuthErrorMessage(
        error instanceof Error ? error.message : undefined,
      ),
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "identity_verification"),
    );
  }

  if (claims.error || !claims.data?.claims?.sub) {
    logOAuthCallbackFailure("claims_rejected", {
      hasFlowId: Boolean(flowOptions),
      hasVerifierCookie,
      errorCode: claims.error?.code,
      errorMessage: safeOAuthErrorMessage(claims.error?.message),
      errorName: claims.error?.name,
      errorStatus: claims.error?.status,
    });
    await supabase.auth.signOut({ scope: "local" });
    return createOAuthCallbackRedirect(
      signInErrorUrl(requestUrl.origin, "identity_verification"),
    );
  }

  return createOAuthCallbackRedirect(new URL(next, requestUrl.origin));
};
