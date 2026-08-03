import Link from "next/link";

import { CourseCard } from "@/components/course-card";
import { LearningStep } from "@/components/learning-step";
import { TerminalCard } from "@/components/terminal-card";
import { betaLessonCount, courses } from "@/data/curriculum";

const proofPoints = [
  { value: "₹0", label: "to start learning" },
  { value: `${betaLessonCount}`, label: "lessons in the beta map" },
  { value: "Open", label: "for public contribution" },
];

export default function Home() {
  return (
    <main id="main-content">
      <section className="hero section">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <div className="announcement">
              <span className="announcement-dot" aria-hidden="true" />
              Free, open source, and built for curious beginners
            </div>
            <h1>
              Stop guessing what AI built. <span>Learn the code.</span>
            </h1>
            <p className="hero-description">
              Vibe to Code teaches you to read, write, test, and improve AI-generated
              code—starting from zero and moving toward real products.
            </p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/lessons/what-is-code">
                Start lesson one <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button-secondary" href="/learn">
                Explore the curriculum
              </Link>
            </div>
            <p className="hero-footnote">No account. No credit card. No experience needed.</p>
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
              <p className="eyebrow">A clear place to begin</p>
              <h2>Learn the parts that vibe coding usually hides.</h2>
            </div>
            <p>
              Start with the shared foundations. Then move into languages and tools only
              when you understand why they exist.
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
            <p className="eyebrow">The learning loop</p>
            <h2>Simple enough for a first-time coder. Useful enough for a founder.</h2>
            <p>
              Every lesson moves through the same four steps, so you always know what to
              do next.
            </p>
            <Link className="text-link" href="/courses/foundations">
              See the complete first course <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="steps-list">
            <LearningStep number="01" title="Understand">
              Get a plain-English mental model before seeing syntax.
            </LearningStep>
            <LearningStep number="02" title="Try">
              Predict the result, then type and change a small example.
            </LearningStep>
            <LearningStep number="03" title="Debug">
              Find a deliberate mistake and learn to read the evidence.
            </LearningStep>
            <LearningStep number="04" title="Build">
              Apply the lesson inside a useful mini-project.
            </LearningStep>
          </div>
        </div>
      </section>

      <section className="section section-dark">
        <div className="shell beta-grid">
          <div>
            <p className="eyebrow eyebrow-light">The first complete route</p>
            <h2>{betaLessonCount} lessons from “what is code?” to shipping safely.</h2>
            <p>
              The public beta focuses on developer foundations, responsible AI use,
              Python, and Git. Web development, SQL, mobile, data, and DevOps follow on
              the same level system.
            </p>
          </div>
          <ol className="beta-roadmap">
            <li>
              <span>12</span>
              <div><strong>Developer foundations</strong><small>How software and tools work</small></div>
            </li>
            <li>
              <span>12</span>
              <div><strong>AI-assisted development</strong><small>Prompt, inspect, test, decide</small></div>
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
            <p className="eyebrow">Built in public</p>
            <h2>See a confusing explanation? Help make it clearer.</h2>
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
