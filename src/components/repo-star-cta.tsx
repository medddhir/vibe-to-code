import { siteConfig } from "@/lib/site";

export function RepoStarCta() {
  return (
    <section className="repo-star-section" aria-labelledby="repo-star-title">
      <div className="shell repo-star-card">
        <div className="repo-star-symbol" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="m12 2.8 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 16.83l-5.5 2.89 1.05-6.12L3.1 9.27l6.15-.9L12 2.8Z" />
          </svg>
        </div>
        <div className="repo-star-copy">
          <h2 id="repo-star-title">Learned something? Star the repo.</h2>
          <p>
            A GitHub star is a tiny thank-you that helps the next vibe coder discover these free lessons.
          </p>
          <ul aria-label="Project promises">
            <li>Free to learn</li>
            <li>Open source</li>
            <li>Built with learners</li>
          </ul>
        </div>
        <div className="repo-star-action">
          <a
            className="repo-star-button"
            href={siteConfig.github}
            target="_blank"
            rel="noreferrer"
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="m12 2.8 2.75 5.57 6.15.9-4.45 4.33 1.05 6.12L12 16.83l-5.5 2.89 1.05-6.12L3.1 9.27l6.15-.9L12 2.8Z" />
            </svg>
            Open GitHub &amp; star
            <svg className="repo-star-arrow" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
              <path d="M5 3h8v8M13 3 3 13" />
            </svg>
          </a>
          <small>On GitHub, tap <strong>Star</strong> near the top-right.</small>
        </div>
      </div>
    </section>
  );
}
