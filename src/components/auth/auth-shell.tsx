import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  footer: ReactNode;
  kicker: string;
  title: string;
};

export function AuthShell({
  children,
  description,
  footer,
  kicker,
  title,
}: AuthShellProps) {
  return (
    <main id="main-content" className="auth-page">
      <section className="auth-stage" aria-labelledby="auth-page-title">
        <div className="shell auth-stage-grid">
          <div className="auth-panel">
            <Link className="auth-back-link" href="/learn">
              <span aria-hidden="true">←</span> Learning paths
            </Link>
            <p className="auth-kicker">{kicker}</p>
            <h1 id="auth-page-title">{title}</h1>
            <p className="auth-description">{description}</p>
            {children}
            <div className="auth-switch">{footer}</div>
          </div>

          <aside className="auth-continuity" aria-labelledby="auth-continuity-title">
            <div>
              <p className="auth-continuity-label">Learning continuity</p>
              <h2 id="auth-continuity-title">Start with Lesson 1. Continue with Google.</h2>
              <p>
                Lesson 1 is available without an account. Later published lessons are protected and require a free Vibe to Code account with Google.
              </p>
            </div>

            <ol className="auth-continuity-list">
              <li>
                <span>01</span>
                <div>
                  <strong>Learn as a guest</strong>
                  <p>Lesson 1 stays open. Start the first lesson without credentials.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Continue with Google</strong>
                  <p>A Google account unlocks later published lessons while keeping all learning free.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Keep your progress</strong>
                  <p>Your completed lessons and checkpoints follow your account across devices.</p>
                </div>
              </li>
            </ol>

            <p className="auth-continuity-note">
              Published learning after Lesson 1 requires Google. All learning remains free, and course-update emails are always opt-in.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
