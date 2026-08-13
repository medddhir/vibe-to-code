import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

import { getSupabasePublicConfig } from "@/lib/supabase/config";

type SupabaseCookieWrite = {
  name: string;
  options: CookieOptions;
  value: string;
};

export const createSupabaseSessionResponse = (
  request: NextRequest,
  cookiesToSet: SupabaseCookieWrite[],
  headersToSet: Record<string, string>,
): NextResponse => {
  cookiesToSet.forEach(({ name, value }) => {
    request.cookies.set(name, value);
  });

  const response = NextResponse.next({ request });

  cookiesToSet.forEach(({ name, options, value }) => {
    response.cookies.set(name, value, options);
  });

  Object.entries(headersToSet).forEach(([name, value]) => {
    response.headers.set(name, value);
  });

  return response;
};

export const updateSupabaseSession = async (
  request: NextRequest,
): Promise<NextResponse> => {
  const config = getSupabasePublicConfig();

  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headersToSet) {
        response = createSupabaseSessionResponse(
          request,
          cookiesToSet,
          headersToSet,
        );
      },
    },
  });

  // getClaims validates the access token and refreshes an expired session when
  // needed. Never authorize a server request from getSession alone.
  try {
    await supabase.auth.getClaims();
  } catch {
    // Authentication outages must not take the public learning experience
    // offline. Private APIs still perform their own fail-closed verification.
  }

  return response;
};
