import type { Metadata } from "next";
import Link from "next/link";

import { AuthMethodForm } from "@/components/auth/auth-method-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { resolveSafeReturnPath } from "@/lib/supabase/return-path";

export const metadata: Metadata = {
  title: "Create account",
  description: "Create a verified Vibe to Code account with Google or an email code.",
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
      kicker="Free learner account"
      title="Keep your progress with you."
      description="Create a verified account now, then connect learning progress across devices safely."
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
