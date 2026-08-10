import type { Metadata } from "next";

import { CourseCard } from "@/components/course-card";
import { coreLessonCount, courses } from "@/data/curriculum";
import { FOUNDATION_PUBLISHED_TOTAL_LESSONS } from "@/data/foundations-level1";

export const metadata: Metadata = {
  title: "Learn",
  description: "Explore the Vibe to Code curriculum, levels, and free learning paths.",
};

const learningStages = [
  ["01", "Orient", "Understand the idea, the tools, and why they exist."],
  ["02", "Read", "Recognise the important parts and explain what they do."],
  ["03", "Try", "Make a small change, predict the result, and observe it."],
  ["04", "Debug", "Use evidence to find and repair realistic mistakes."],
  ["05", "Build", "Combine the ideas inside a useful project."],
  ["06", "Verify", "Test, secure, publish, and explain what you made."],
];

export default function LearnPage() {
  return (
    <main id="main-content">
      <section className="page-hero section">
        <div className="shell narrow-shell">
          <h1>The complete learning route.</h1>
          <p>
            Begin with {FOUNDATION_PUBLISHED_TOTAL_LESSONS} published Foundation lessons,
            then follow the full {coreLessonCount}-lesson mapped route without jumping
            randomly between tutorials.
          </p>
        </div>
      </section>

      <section className="section section-soft">
        <div className="shell">
          <div className="section-heading compact-heading">
            <div>
              <h2>One rhythm across every course.</h2>
            </div>
            <p>Each course uses as many levels as its subject needs, but every path repeats these six beginner-friendly stages.</p>
          </div>
          <div className="level-grid">
            {learningStages.map(([number, title, description]) => (
              <article key={number} className="level-card">
                <span>Stage {number}</span>
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
              <h2>Choose your next route.</h2>
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
