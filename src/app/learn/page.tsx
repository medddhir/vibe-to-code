import type { Metadata } from "next";
import Link from "next/link";

import { coreLessonCount, courses } from "@/data/curriculum";
import { FOUNDATION_PUBLISHED_TOTAL_LESSONS } from "@/data/foundations-level1";

export const metadata: Metadata = {
  title: "Learning paths",
  description: "Explore the Vibe to Code curriculum, levels, and free learning paths.",
};

const learningStages = [
  ["01", "Orient", "Understand the idea, the tools, and why they exist."],
  ["02", "Read", "Recognise the important parts and explain what they do."],
  ["03", "Try", "Make one change, predict the result, and observe it."],
  ["04", "Debug", "Use evidence to find and repair realistic mistakes."],
  ["05", "Build", "Combine the ideas inside a useful project."],
  ["06", "Verify", "Test, secure, publish, and explain what you made."],
];

export default function LearnPage() {
  return (
    <main id="main-content" className="premium-page premium-learn-page">
      <section className="premium-page-hero">
        <div className="shell premium-page-hero-grid">
          <div>
            <p className="premium-page-kicker">Curriculum index / 2026</p>
            <h1>Every path. One way forward.</h1>
            <p>
              Start with the {FOUNDATION_PUBLISHED_TOTAL_LESSONS} guided lessons that
              are live today, then follow a transparent {coreLessonCount}-lesson core
              roadmap without bouncing between disconnected tutorials.
            </p>
            <Link className="button button-primary" href="/lessons/what-is-code">
              Start Level 0 <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <aside className="curriculum-brief" aria-label="Curriculum at a glance">
            <header>
              <span>System brief</span>
              <small>VTC / LEARN</small>
            </header>
            <dl>
              <div><dt>Live now</dt><dd>{FOUNDATION_PUBLISHED_TOTAL_LESSONS}</dd></div>
              <div><dt>Core route</dt><dd>{coreLessonCount}</dd></div>
              <div><dt>Learning paths</dt><dd>{courses.length}</dd></div>
              <div><dt>Starting cost</dt><dd>₹0</dd></div>
            </dl>
            <p><i aria-hidden="true" /> Guest progress stays on this device</p>
          </aside>
        </div>
      </section>

      <section className="premium-stages-section" aria-labelledby="rhythm-title">
        <div className="shell">
          <div className="premium-secondary-heading">
            <span>01 / Learning rhythm</span>
            <h2 id="rhythm-title">The interface changes. The method doesn&apos;t.</h2>
            <p>Six recognisable stages take you from a new idea to something you can test and explain.</p>
          </div>

          <ol className="premium-stage-list">
            {learningStages.map(([number, title, description]) => (
              <li key={number}>
                <span>{number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="premium-directory-section" aria-labelledby="directory-title">
        <div className="shell">
          <div className="premium-secondary-heading">
            <span>02 / Course directory</span>
            <h2 id="directory-title">Choose the problem you want to understand.</h2>
            <p>Live means usable today. In production and mapped routes show the complete shape of what comes next.</p>
          </div>

          <ol className="premium-course-directory">
            {courses.map((course, index) => {
              const availability = index === 0
                ? `${FOUNDATION_PUBLISHED_TOTAL_LESSONS} live now`
                : course.status === "Mapped" ? "Mapped route" : "In production";

              return (
                <li key={course.slug} className={index === 0 ? "is-live" : undefined}>
                  <Link href={`/courses/${course.slug}`}>
                    <span className="premium-course-number">{String(index + 1).padStart(2, "0")}</span>
                    <div className="premium-course-title">
                      <small>{course.eyebrow}</small>
                      <h3>{course.name}</h3>
                    </div>
                    <p>{course.description}</p>
                    <div className="premium-course-meta">
                      <span>{availability}</span>
                      <small>{course.lessonCount} lessons / {course.levelCount} {course.levelCount === 1 ? "level" : "levels"}</small>
                    </div>
                    <i aria-hidden="true">↗</i>
                  </Link>
                </li>
              );
            })}
          </ol>
        </div>
      </section>
    </main>
  );
}
