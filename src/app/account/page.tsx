import type { Metadata } from "next";

import { AccountPageClient } from "@/components/auth/account-page-client";

export const metadata: Metadata = {
  title: "Your account",
  description: "Manage your Vibe to Code account and learning continuity.",
  robots: { follow: false, index: false },
};

export default function AccountPage() {
  return (
    <main id="main-content" className="account-page">
      <div className="shell account-page-shell">
        <AccountPageClient />
      </div>
    </main>
  );
}
