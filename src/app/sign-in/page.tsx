import type { Metadata } from "next";
import Link from "next/link";

import { AuthMethodForm } from "@/components/auth/auth-method-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { resolveSafeReturnPath } from "@/lib/supabase/return-path";

export const metadata: Metadata = {
  title: "Sign in",
  description: "Sign in to Vibe to Code securely with Google.",
};

type SignInPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const query = await searchParams;
  const returnTo = resolveSafeReturnPath(firstValue(query.next), "/learn");
  const initialErrorCode = firstValue(query.error);

  return (
    <AuthShell
      kicker="Verified account access"
      title="Welcome back."
      description="Lesson 1 is available without an account. Sign in with Google to continue every published lesson on this account."
      footer={
        <p>
          New to Vibe to Code? <Link href={`/sign-up?next=${encodeURIComponent(returnTo)}`}>Create a free account</Link>
        </p>
      }
    >
      <AuthMethodForm
        intent="sign-in"
        returnTo={returnTo}
        initialErrorCode={initialErrorCode}
      />
    </AuthShell>
  );
}
