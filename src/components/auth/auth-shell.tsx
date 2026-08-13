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
              <h2 id="auth-continuity-title">Start anywhere. Keep your place.</h2>
              <p>
                Accounts add verified identity without putting a wall in front of
                the lessons.
              </p>
            </div>

            <ol className="auth-continuity-list">
              <li>
                <span>01</span>
                <div>
                  <strong>Learn as a guest</strong>
                  <p>Every public lesson stays open. Progress remains on this device.</p>
                </div>
              </li>
              <li>
                <span>02</span>
                <div>
                  <strong>Verify your inbox</strong>
                  <p>A one-time code confirms that the email belongs to you.</p>
                </div>
              </li>
              <li>
                <span>03</span>
                <div>
                  <strong>Protect the stronger record</strong>
                  <p>When sync runs, the more complete learning record wins.</p>
                </div>
              </li>
            </ol>

            <p className="auth-continuity-note">
              Guest access stays free. An account is for continuity, not permission.
            </p>
          </aside>
        </div>
      </section>
    </main>
  );
}
