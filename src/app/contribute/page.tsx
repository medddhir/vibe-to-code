import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Help improve Vibe to Code lessons, examples, accessibility, and translations.",
};

const contributionTypes = [
  ["Fix a lesson", "Correct an unclear sentence, broken example, typo, or accessibility issue."],
  ["Add an exercise", "Contribute a prediction task, bug hunt, quiz, or practical mini-project."],
  ["Build a course", "Help turn a mapped language or tool into a complete, reviewed learning path."],
  ["Improve the product", "Work on performance, responsive design, accessibility, or the curriculum engine."],
];

const qualityStandards = [
  "Assume the learner knows nothing yet.",
  "Explain the purpose before the syntax.",
  "Use small, working, testable examples.",
  "Never hide a safety or security risk.",
  "Keep phones readable and keyboards usable.",
  "Never present unchecked AI output as verified.",
];

export default function ContributePage() {
  return (
    <main id="main-content" className="premium-page premium-contribute-page">
      <section className="premium-page-hero premium-contribute-hero">
        <div className="shell premium-page-hero-grid">
          <div>
            <p className="premium-page-kicker">Open-source education / public repo</p>
            <h1>Make one lesson clearer.</h1>
            <p>
              You do not need to be a senior engineer. A simpler explanation, a
              corrected example, and a better question can change the next learner&apos;s route.
            </p>
            <a
              className="button button-primary"
              href="https://github.com/medddhir/vibe-to-code"
              target="_blank"
              rel="noreferrer"
            >
              Open the public repository <span aria-hidden="true">↗</span>
            </a>
          </div>

          <aside className="contributor-diff" aria-label="What a good contribution changes">
            <header><span>lesson-quality.diff</span><small>review ready</small></header>
            <div>
              <p><span>−</span> Just paste this command.</p>
              <p className="is-added"><span>+</span> First, understand what the command changes.</p>
              <p className="is-added"><span>+</span> Run it in a safe practice folder.</p>
              <p className="is-added"><span>+</span> Verify the output before continuing.</p>
            </div>
            <footer><i aria-hidden="true" /> Clearer for the next learner</footer>
          </aside>
        </div>
      </section>

      <section className="premium-contribution-modes" aria-labelledby="contribution-title">
        <div className="shell">
          <div className="premium-secondary-heading">
            <span>01 / Ways in</span>
            <h2 id="contribution-title">Useful work at every experience level.</h2>
            <p>Start with the problem you can see clearly. Small, reviewable improvements are welcome.</p>
          </div>

          <ol className="contribution-mode-list">
            {contributionTypes.map(([title, description], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <i aria-hidden="true">↘</i>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="premium-quality-section" aria-labelledby="quality-title">
        <div className="shell premium-quality-grid">
          <div>
            <span>02 / Review standard</span>
            <h2 id="quality-title">Clear beats clever.</h2>
            <p>Every contribution should leave the learner with less confusion and more evidence.</p>
          </div>

          <ol>
            {qualityStandards.map((standard, index) => (
              <li key={standard}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <p>{standard}</p>
              </li>
            ))}
          </ol>
        </div>

        <div className="shell premium-contribution-cta">
          <p>Ready to improve the manual?</p>
          <a
            className="button"
            href="https://github.com/medddhir/vibe-to-code/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noreferrer"
          >
            Read the contribution guide <span aria-hidden="true">↗</span>
          </a>
        </div>
      </section>
    </main>
  );
}
