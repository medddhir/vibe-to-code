import Link from "next/link";

import { BrandMark } from "@/components/brand-mark";
import { getPublishedLessonCatalogEntries } from "@/lib/lesson-registry";

export function SiteFooter() {
  const publishedLessonCount = getPublishedLessonCatalogEntries().length;
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div className="footer-brand">
          <BrandMark />
          <p>
            The learning layer between an AI-generated first draft and software
            you can confidently call your own.
          </p>
          <span className="footer-status"><i aria-hidden="true" /> {publishedLessonCount} guided lessons live</span>
        </div>

        <div className="footer-links">
          <div>
            <strong>Learn</strong>
            <Link href="/lessons/what-is-code">Start Level 0</Link>
            <Link href="/courses/foundations">Developer Foundations</Link>
            <Link href="/learn">All learning paths</Link>
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
          <div>
            <strong>Follow</strong>
            <a href="https://x.com/VibeToCode" target="_blank" rel="noreferrer">
              X / Twitter
            </a>
            <a href="https://www.instagram.com/vibe.to.code/" target="_blank" rel="noreferrer">
              Instagram
            </a>
          </div>
        </div>
      </div>

      <div className="shell footer-bottom">
        <p>© 2026 Vibe to Code · A TurboPay Technologies initiative.</p>
        <p>Free to learn. Open to improve.</p>
      </div>
    </footer>
  );
}
