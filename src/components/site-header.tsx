import Link from "next/link";

import { AccountEntry } from "@/components/auth/account-entry";
import { BrandMark } from "@/components/brand-mark";
import { MobileNavigationMenu } from "@/components/mobile-navigation-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { href: "/learn", label: "Learning paths" },
  { href: "/courses/foundations", label: "Foundations" },
  { href: "/contribute", label: "Open source" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="shell header-inner">
        <Link href="/" className="brand-link" aria-label="Vibe to Code home">
          <BrandMark />
        </Link>

        <nav className="desktop-nav" aria-label="Primary navigation">
          {navigation.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="header-actions">
          <ThemeToggle />
          <div className="header-account-slot">
            <AccountEntry />
          </div>
          <Link className="button button-small" href="/lessons/what-is-code">
            Start Level 0
          </Link>
          <MobileNavigationMenu navigation={navigation} />
        </div>
      </div>
    </header>
  );
}
