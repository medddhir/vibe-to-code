import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contribute",
  description: "Help improve Vibe to Code lessons, examples, accessibility, and translations.",
};

const contributionTypes = [
  ["Fix a lesson", "Correct an unclear sentence, broken example, typo, or accessibility issue."],
  ["Add an exercise", "Contribute a prediction task, bug hunt, quiz, or practical mini-project."],
  ["Build a course", "Help turn a mapped language or tool into a complete, reviewed learning path."],
  ["Improve the site", "Work on performance, responsive design, accessibility, or the curriculum engine."],
];

export default function ContributePage() {
  return (
    <main id="main-content">
      <section className="page-hero section">
        <div className="shell narrow-shell">
          <p className="eyebrow">Open source education</p>
          <h1>Make one lesson clearer for the next learner.</h1>
          <p>
            You do not need to be a senior engineer. Useful examples, simpler words,
            corrected mistakes, and better questions all matter.
          </p>
          <a
            className="button button-primary"
            href="https://github.com/medddhir/vibe-to-code"
            target="_blank"
            rel="noreferrer"
          >
            Open the public repository <span aria-hidden="true">→</span>
          </a>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="contribution-grid">
            {contributionTypes.map(([title, description], index) => (
              <article key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h2>{title}</h2>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell narrow-shell contribution-standards">
          <div>
            <p className="eyebrow">Quality standard</p>
            <h2>Clear beats clever.</h2>
          </div>
          <ul className="check-list">
            <li>Assume the learner knows nothing yet.</li>
            <li>Explain the purpose before the syntax.</li>
            <li>Use small, working, testable examples.</li>
            <li>Never hide a safety or security risk.</li>
            <li>Keep text readable on phones and keyboards usable.</li>
            <li>Do not present AI output as verified without checking it.</li>
          </ul>
          <p className="contribution-note">
            Read <code>CONTRIBUTING.md</code> in the repository for branch, lesson, review,
            and pull-request instructions.
          </p>
        </div>
      </section>
    </main>
  );
}
