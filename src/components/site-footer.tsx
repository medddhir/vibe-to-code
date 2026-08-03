import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <BrandMark />
          <p>
            Free, open-source coding education for people who started with AI
            and want to understand what they are building.
          </p>
        </div>

        <div className="footer-links">
          <div>
            <strong>Learn</strong>
            <Link href="/learn">All courses</Link>
            <Link href="/courses/foundations">Start here</Link>
            <Link href="/lessons/what-is-code">First lesson</Link>
          </div>
          <div>
            <strong>Project</strong>
            <Link href="/contribute">Contribute</Link>
            <a
              href="https://github.com/medddhir/vibe-to-code"
              target="_blank"
              rel="noreferrer"
            >
              GitHub
            </a>
            <a href="https://turbo-pay.in" target="_blank" rel="noreferrer">
              TurboPay
            </a>
          </div>
        </div>
      </div>

      <div className="shell footer-bottom">
        <p>Created by Medhir · A TurboPay Technologies initiative.</p>
        <p>Core learning stays free.</p>
      </div>
    </footer>
  );
}
