import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "Verify email",
  description: "Verify your email with a one-time Vibe to Code access code.",
  robots: { follow: false, index: false },
};

export default function VerifyEmailPage() {
  redirect("/sign-in");
}
