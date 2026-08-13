import type { Metadata } from "next";
import Link from "next/link";

import { EmailCodeForm } from "@/components/auth/email-code-form";
import { AuthShell } from "@/components/auth/auth-shell";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your email with a one-time Vibe to Code access code.",
  robots: { follow: false, index: false },
};

export default function VerifyEmailPage() {
  return (
    <AuthShell
      kicker="One-time verification"
      title="Check your inbox."
      description="Enter the 6-digit code from the latest Vibe to Code email."
      footer={
        <p>
          Want to keep learning instead? <Link href="/lessons/what-is-code">Continue as a guest</Link>
        </p>
      }
    >
      <EmailCodeForm />
    </AuthShell>
  );
}
