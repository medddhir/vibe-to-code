import Link from "next/link";

import type { Course } from "@/data/curriculum";

export function CourseCard({ course, featured = false }: { course: Course; featured?: boolean }) {
  return (
    <article
      className={`course-card course-accent-${course.accent}${featured ? " course-card-featured" : ""}`}
    >
      <div className="course-card-topline">
        <span className="course-symbol" aria-hidden="true">
          {course.shortName.slice(0, 2).toUpperCase()}
        </span>
        <span className={`status status-${course.status.toLowerCase().replace(" ", "-")}`}>
          {course.status}
        </span>
      </div>
      <p className="course-route-label">{course.eyebrow}</p>
      <h3>{course.name}</h3>
      <p>{course.description}</p>
      <div className="course-route-line" aria-hidden="true">
        <span />
        <i />
        <i />
        <i />
      </div>
      <div className="course-meta" aria-label="Course size">
        <span>{course.lessonCount} lessons</span>
        <span>{course.levelCount} {course.levelCount === 1 ? "level" : "levels"}</span>
      </div>
      <Link className="text-link" href={`/courses/${course.slug}`}>
        View course <span aria-hidden="true">→</span>
      </Link>
    </article>
  );
}
