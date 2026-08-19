import Link from "next/link";

import { MiniLessonLab } from "@/components/mini-lesson-lab";
import { coreLessonCount, courses } from "@/data/curriculum";
import { FOUNDATION_PUBLISHED_TOTAL_LESSONS } from "@/data/foundations-level1";

const learningProtocol = [
  {
    title: "Understand",
    description: "Start with the mental model in plain language, before syntax gets a chance to distract you.",
    signal: "Why it exists",
  },
  {
    title: "Inspect",
    description: "Trace the important parts of real code and see which decisions control the result.",
    signal: "What it controls",
  },
  {
    title: "Change",
    description: "Make one deliberate edit, predict what should happen, and watch the interface respond.",
    signal: "What you changed",
  },
  {
    title: "Verify",
    description: "Use output, errors, and tests to prove the result instead of trusting a confident guess.",
    signal: "How you know",
  },
];

const proofPoints = [
  { value: String(FOUNDATION_PUBLISHED_TOTAL_LESSONS), label: "guided lessons live" },
  { value: String(coreLessonCount), label: "core lessons mapped" },
  { value: "₹0", label: "to start learning" },
];

export default function Home() {
  const foundation = courses[0];
  const upcomingCourses = courses.slice(1);

  return (
    <main id="main-content" className="premium-home">
      <section className="vtc-hero" aria-labelledby="hero-title">
        <div className="shell vtc-hero-frame">
          <div className="vtc-hero-copy">
            <p className="vtc-kicker"><i aria-hidden="true" /> Built for the AI-first generation</p>
            <h1 id="hero-title">
              Build with AI. <span>Understand every line.</span>
            </h1>
            <p className="vtc-hero-description">
              Learn what AI writes, fix what breaks, and ship products you can
              actually own, from your first file to your first production build.
            </p>

            <div className="vtc-hero-actions">
              <Link className="button button-primary vtc-button-primary" href="/lessons/what-is-code">
                Start Level 0 <span aria-hidden="true">↗</span>
              </Link>
              <Link className="button vtc-button-quiet" href="/learn">
                Explore learning paths
              </Link>
            </div>

            <p className="vtc-guest-note">
              <span aria-hidden="true">✓</span>
              Try Lesson 1 without an account. Continue every published lesson free with Google.
            </p>
          </div>

          <MiniLessonLab />
        </div>

        <div className="shell vtc-proof-rail" aria-label="Platform facts">
          <p>Learning system / live state</p>
          <div>
            {proofPoints.map((point) => (
              <span key={point.label}>
                <strong>{point.value}</strong>
                <small>{point.label}</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="vtc-manifesto vtc-section" aria-labelledby="manifesto-title">
        <div className="shell vtc-manifesto-grid">
          <span className="vtc-section-index" aria-hidden="true">01 / The shift</span>
          <div>
            <p>AI made building faster.</p>
            <h2 id="manifesto-title">Understanding is what makes it yours.</h2>
          </div>
          <p className="vtc-manifesto-note">
            For founders, creators, students, and curious builders who can make
            something appear with a prompt, but refuse to stay dependent on one.
          </p>
        </div>
      </section>

      <section className="vtc-protocol vtc-section" aria-labelledby="protocol-title">
        <div className="shell vtc-protocol-grid">
          <div className="vtc-protocol-intro">
            <span className="vtc-section-index">02 / The method</span>
            <h2 id="protocol-title">One learning loop. Every technical skill.</h2>
            <p>
              The subject changes. The rhythm stays familiar, so your attention
              goes into the idea, not figuring out how the lesson works.
            </p>
            <Link className="vtc-arrow-link" href="/courses/foundations">
              Inspect the Foundations route <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <ol className="vtc-protocol-list">
            {learningProtocol.map((step, index) => (
              <li key={step.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div>
                  <small>{step.signal}</small>
                  <h3>{step.title}</h3>
                  <p>{step.description}</p>
                </div>
                <i aria-hidden="true">↘</i>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="vtc-paths vtc-section" aria-labelledby="paths-title">
        <div className="shell">
          <div className="vtc-paths-heading">
            <span className="vtc-section-index">03 / Learning paths</span>
            <h2 id="paths-title">A route through the noise.</h2>
            <p>
              Start with the systems every developer uses. Add languages and tools
              only when you understand the problem each one solves.
            </p>
          </div>

          <div className="vtc-paths-grid">
            <article className="vtc-live-course">
              <header>
                <span className="vtc-live-badge"><i aria-hidden="true" /> Live now</span>
                <span>Course 001</span>
              </header>
              <p>{foundation.eyebrow}</p>
              <h3>{foundation.name}</h3>
              <p>{foundation.description}</p>

              <div className="vtc-course-route" aria-label={`${FOUNDATION_PUBLISHED_TOTAL_LESSONS} of ${foundation.lessonCount} lessons published`}>
                <div>
                  <span style={{ width: `${(FOUNDATION_PUBLISHED_TOTAL_LESSONS / foundation.lessonCount) * 100}%` }} />
                </div>
                <p>
                  <strong>{FOUNDATION_PUBLISHED_TOTAL_LESSONS} live</strong>
                  <span>{foundation.lessonCount} total · {foundation.levelCount} levels</span>
                </p>
              </div>

              <Link className="button vtc-course-button" href="/lessons/what-is-code">
                Start Level 0 <span aria-hidden="true">→</span>
              </Link>
            </article>

            <ol className="vtc-course-index">
              {upcomingCourses.map((course, index) => (
                <li key={course.slug}>
                  <Link href={`/courses/${course.slug}`}>
                    <span>{String(index + 2).padStart(3, "0")}</span>
                    <div>
                      <small>{course.status === "Mapped" ? "Mapped route" : "In production"}</small>
                      <h3>{course.name}</h3>
                      <p>{course.lessonCount} lessons · {course.levelCount} {course.levelCount === 1 ? "level" : "levels"}</p>
                    </div>
                    <i aria-hidden="true">↗</i>
                  </Link>
                </li>
              ))}
            </ol>
          </div>

          <Link className="vtc-arrow-link vtc-all-paths-link" href="/learn">
            View the complete curriculum <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>

      <section className="vtc-open-source vtc-section" aria-labelledby="open-source-title">
        <div className="shell vtc-open-source-grid">
          <div>
            <span className="vtc-section-index">04 / Built in public</span>
            <h2 id="open-source-title">The learning manual is open.</h2>
          </div>
          <div>
            <p>
              Read every lesson. Inspect every change. Improve an explanation,
              repair an example, or help shape the next learning path.
            </p>
            <div className="vtc-open-source-actions">
              <Link className="button vtc-light-button" href="/contribute">
                How to contribute
              </Link>
              <a
                className="vtc-inline-link"
                href="https://github.com/medddhir/vibe-to-code"
                target="_blank"
                rel="noreferrer"
              >
                Open GitHub <span aria-hidden="true">↗</span>
              </a>
            </div>
          </div>
          <div className="vtc-repo-mark" aria-hidden="true">
            <span>PUBLIC</span>
            <strong>OPEN<br />SOURCE</strong>
            <small>Learn / inspect / improve</small>
          </div>
        </div>
      </section>

      <section className="vtc-final-cta vtc-section" aria-labelledby="final-cta-title">
        <div className="shell vtc-final-cta-grid">
          <span className="vtc-section-index">Your next move / 01</span>
          <div>
            <h2 id="final-cta-title">Stop borrowing confidence from the prompt.</h2>
            <p>Start with what code is. Leave knowing how to inspect what comes next.</p>
          </div>
          <Link className="button button-primary vtc-button-primary" href="/lessons/what-is-code">
            Start Level 0 <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
    </main>
  );
}
