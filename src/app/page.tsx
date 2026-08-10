import Link from "next/link";

import { CourseCard } from "@/components/course-card";
import { TerminalCard } from "@/components/terminal-card";
import { coreLessonCount, courses } from "@/data/curriculum";
import { FOUNDATION_PUBLISHED_TOTAL_LESSONS } from "@/data/foundations-level1";

const proofPoints = [
  { value: "₹0", label: "Core learning" },
  { value: `${coreLessonCount}`, label: "Mapped lessons" },
  { value: String(FOUNDATION_PUBLISHED_TOTAL_LESSONS), label: "Foundation lessons live" },
];

const inspectionProtocol = [
  ["Understand", "Read the mental model in plain language before touching syntax."],
  ["Inspect", "See the important parts of real code and trace what each one controls."],
  ["Change", "Make one deliberate edit and predict what should happen next."],
  ["Verify", "Use output, errors, and tests to prove the result instead of guessing."],
];

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero section inspection-hero">
        <div className="shell hero-grid inspection-hero-grid">
          <div className="hero-copy">
            <h1>
              AI gave you the code. <span>Now make it yours.</span>
            </h1>
            <p className="hero-description">
              Vibe to Code turns generated code into a path you can inspect, change,
              debug, and verify—starting at zero, ending with software you understand.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/lessons/what-is-code">
                Start Developer Foundations <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button-secondary" href="/learn">
                Explore the curriculum
              </Link>
            </div>
            <div className="hero-assurance" aria-label="What you need to start">
              <span>No account</span>
              <span>No payment</span>
              <span>No coding experience</span>
            </div>
          </div>
          <TerminalCard />
        </div>

        <div className="shell proof-strip" aria-label="Platform facts">
          {proofPoints.map((point) => (
            <div key={point.label}>
              <strong>{point.value}</strong>
              <span>{point.label}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="section section-soft" id="courses">
        <div className="shell">
          <div className="section-heading">
            <div>
              <h2>One route out of tutorial chaos.</h2>
            </div>
            <p>
              Begin with the systems every developer uses. Add languages and tools only
              when you know what problem each one solves.
            </p>
          </div>
          <div className="course-grid">
            {courses.map((course, index) => (
              <CourseCard key={course.slug} course={course} featured={index === 0} />
            ))}
          </div>
        </div>
      </section>

      <section className="section" id="method">
        <div className="shell method-grid">
          <div className="method-intro">
            <h2>A repeatable inspection protocol.</h2>
            <p>
              Every lesson uses the same four-stage route. The subject changes; the way
              you build confidence stays familiar.
            </p>
            <Link className="text-link" href="/courses/foundations">
              See the complete first course roadmap <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ol className="steps-list inspection-protocol">
            {inspectionProtocol.map(([title, description], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section section-dark">
        <div className="shell beta-grid">
          <div>
            <h2>A curriculum that shows its full wiring.</h2>
            <p>
              The {coreLessonCount}-lesson core roadmap connects computer confidence,
              responsible AI use, Python, and Git. Published lessons work now; mapped
              lessons show exactly what the route will cover.
            </p>
          </div>
          <ol className="beta-roadmap">
            <li>
              <span>46</span>
              <div><strong>Developer foundations</strong><small>From files and terminals to a shipped capstone</small></div>
            </li>
            <li>
              <span>120</span>
              <div><strong>AI-assisted development</strong><small>Prompt, build, inspect, secure, test, and ship</small></div>
            </li>
            <li>
              <span>24</span>
              <div><strong>Python fundamentals</strong><small>Logic, data, files, and a capstone</small></div>
            </li>
            <li>
              <span>12</span>
              <div><strong>Git and GitHub</strong><small>Track, review, collaborate, recover</small></div>
            </li>
          </ol>
        </div>
      </section>

      <section className="section">
        <div className="shell open-source-card">
          <div>
            <h2>The learning manual is open.</h2>
            <p>
              The repository is public. Developers, teachers, students, and first-time
              contributors can improve lessons, fix examples, or add new learning paths.
            </p>
          </div>
          <div className="open-source-actions">
            <Link className="button button-primary" href="/contribute">
              How to contribute
            </Link>
            <a
              className="button button-secondary"
              href="https://github.com/medddhir/vibe-to-code"
              target="_blank"
              rel="noreferrer"
            >
              View GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
