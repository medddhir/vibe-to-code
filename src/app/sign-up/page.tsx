import type { Metadata } from "next";
import Link from "next/link";

import { AuthMethodForm } from "@/components/auth/auth-method-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { resolveSafeReturnPath } from "@/lib/supabase/return-path";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a free Vibe to Code account securely with Google.",
};

type SignUpPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
  const query = await searchParams;
  const returnTo = resolveSafeReturnPath(firstValue(query.next), "/courses/foundations");

  return (
    <AuthShell
      kicker="Continue with Google"
      title="Keep learning beyond Lesson 1."
      description="Lesson 1 is open now. Create a free Vibe to Code account with Google to continue all later published lessons. Progress can sync when that feature is enabled."
      footer={
        <p>
          Already have an account? <Link href={`/sign-in?next=${encodeURIComponent(returnTo)}`}>Sign in</Link>
        </p>
      }
    >
      <AuthMethodForm intent="sign-up" returnTo={returnTo} />
    </AuthShell>
  );
}
