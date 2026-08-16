import Link from "next/link";

import { foundationLevels } from "@/data/course-content";
import {
  FOUNDATION_PUBLISHED_LEVELS,
  FOUNDATION_PUBLISHED_TOTAL_LESSONS,
} from "@/data/foundations-level1";

export function LiveCurriculumCard() {
  return (
    <aside className="vtc-live-curriculum" aria-label="Live Developer Foundations curriculum">
      <header>
        <div>
          <span>Developer Foundations</span>
          <strong>Published curriculum</strong>
        </div>
        <span className="vtc-live-count">
          <i aria-hidden="true" /> {FOUNDATION_PUBLISHED_TOTAL_LESSONS} lessons live
        </span>
      </header>

      <div className="vtc-live-levels">
        {FOUNDATION_PUBLISHED_LEVELS.map((level) => {
          const levelIndex = foundationLevels.findIndex(
            (candidate) => candidate.label === level.label && candidate.title === level.title,
          );
          const outlinedLessonCount = foundationLevels[levelIndex]?.lessons.length
            ?? level.lessons.length;
          return (
            <article key={level.label}>
              <div className="vtc-live-level-heading">
                <span>{level.label}</span>
                <small>{level.lessons.length}/{outlinedLessonCount} published</small>
              </div>
              <h2>{level.title}</h2>
              <p>{level.description}</p>
              <ol aria-label={`${level.label} published lesson sequence`}>
                {level.lessons.map((lesson, lessonIndex) => (
                  <li key={lesson.title}>
                    <span>{String(lessonIndex + 1).padStart(2, "0")}</span>
                    <span>{lesson.title}</span>
                  </li>
                ))}
              </ol>
              <Link href={`/courses/foundations#level-${levelIndex + 1}`}>
                Open {level.label} <span aria-hidden="true">↗</span>
              </Link>
            </article>
          );
        })}
      </div>

      <footer>
        <span>Interactive lessons. Progress saved on this device.</span>
        <Link href="/courses/foundations#course-levels">
          Review all published lessons <span aria-hidden="true">→</span>
        </Link>
      </footer>
    </aside>
  );
}
