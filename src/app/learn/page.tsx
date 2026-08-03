import type { Metadata } from "next";

import { CourseCard } from "@/components/course-card";
import { betaLessonCount, courses } from "@/data/curriculum";

export const metadata: Metadata = {
  title: "Learn",
  description: "Explore the Vibe to Code curriculum, levels, and free learning paths.",
};

const levels = [
  ["0", "Orientation", "What it is, why it exists, and how to run it."],
  ["1", "Fundamentals", "Read and write the essential syntax."],
  ["2", "Applied", "Solve useful problems with confidence."],
  ["3", "Builder", "Create complete small applications."],
  ["4", "Production", "Test, secure, deploy, and maintain."],
  ["5", "Advanced", "Understand internals and architecture."],
];

export default function LearnPage() {
  return (
    <main id="main-content">
      <section className="page-hero section">
        <div className="shell narrow-shell">
          <p className="eyebrow">The curriculum</p>
          <h1>One learning system. Every practical coding path.</h1>
          <p>
            Begin with the {betaLessonCount}-lesson beta route, then grow through a
            consistent six-level system without jumping randomly between tutorials.
          </p>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">How levels work</p>
              <h2>A visible path from zero to production.</h2>
            </div>
          </div>
          <div className="level-grid">
            {levels.map(([number, title, description]) => (
              <article key={number} className="level-card">
                <span>Level {number}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="shell">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">Course catalogue</p>
              <h2>Start with what you need now.</h2>
            </div>
            <p>Available lessons are usable today. Mapped tracks show exactly what comes next.</p>
          </div>
          <div className="course-grid">
            {courses.map((course, index) => (
              <CourseCard key={course.slug} course={course} featured={index === 0} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
