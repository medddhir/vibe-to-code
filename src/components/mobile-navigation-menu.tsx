"use client";

import Link from "next/link";
import { useRef, type KeyboardEvent } from "react";

import { AccountEntry } from "@/components/auth/account-entry";

type NavigationItem = {
  href: string;
  label: string;
};

type MobileNavigationMenuProps = {
  navigation: readonly NavigationItem[];
};

export function MobileNavigationMenu({ navigation }: MobileNavigationMenuProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const summaryRef = useRef<HTMLElement>(null);

  function closeMenu() {
    detailsRef.current?.removeAttribute("open");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDetailsElement>) {
    if (event.key !== "Escape" || !detailsRef.current?.open) {
      return;
    }

    event.preventDefault();
    closeMenu();
    summaryRef.current?.focus();
  }

  return (
    <details className="mobile-menu" ref={detailsRef} onKeyDown={handleKeyDown}>
      <summary ref={summaryRef} aria-label="Open navigation menu">Menu</summary>
      <nav aria-label="Mobile navigation">
        <Link
          className="mobile-menu-primary"
          href="/lessons/what-is-code"
          onClick={closeMenu}
        >
          Start Level 0 <span aria-hidden="true">→</span>
        </Link>
        <AccountEntry variant="mobile" />
        {navigation.map((item) => (
          <Link key={item.href} href={item.href} onClick={closeMenu}>
            {item.label}
          </Link>
        ))}
        <a
          href="https://github.com/medddhir/vibe-to-code"
          target="_blank"
          rel="noreferrer"
          onClick={closeMenu}
        >
          GitHub
        </a>
      </nav>
    </details>
  );
}
