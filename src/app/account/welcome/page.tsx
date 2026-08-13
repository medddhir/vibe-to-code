import type { Metadata } from "next";

import { AccountWelcomeClient } from "@/components/auth/account-welcome-client";

export const metadata: Metadata = {
  title: "Account ready",
  description: "Finish setting up your verified Vibe to Code learner account.",
  robots: { follow: false, index: false },
};

export default function AccountWelcomePage() {
  return (
    <main id="main-content" className="account-page account-welcome-page">
      <div className="shell account-page-shell">
        <AccountWelcomeClient />
      </div>
    </main>
  );
}
