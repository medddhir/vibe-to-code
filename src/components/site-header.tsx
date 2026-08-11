import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
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
          <Link className="button button-small" href="/lessons/what-is-code">
            Start Level 0
          </Link>
          <details className="mobile-menu">
            <summary aria-label="Open navigation menu">Menu</summary>
            <nav aria-label="Mobile navigation">
              <Link className="mobile-menu-primary" href="/lessons/what-is-code">
                Start Level 0 <span aria-hidden="true">→</span>
              </Link>
              {navigation.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <a
                href="https://github.com/medddhir/vibe-to-code"
                target="_blank"
                rel="noreferrer"
              >
                GitHub
              </a>
            </nav>
          </details>
        </div>
      </div>
    </header>
  );
}
