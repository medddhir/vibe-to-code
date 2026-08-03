import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { courses, getCourse } from "@/data/curriculum";

type CoursePageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return courses.map((course) => ({ slug: course.slug }));
}

export async function generateMetadata({ params }: CoursePageProps): Promise<Metadata> {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    return { title: "Course not found" };
  }

  return {
    title: course.name,
    description: course.description,
  };
}

export default async function CoursePage({ params }: CoursePageProps) {
  const { slug } = await params;
  const course = getCourse(slug);

  if (!course) {
    notFound();
  }

  return (
    <main id="main-content">
      <section className={`course-hero section course-accent-${course.accent}`}>
        <div className="shell narrow-shell">
          <Link className="breadcrumb" href="/learn">
            ← All courses
          </Link>
          <div className="course-title-row">
            <span className="course-symbol course-symbol-large" aria-hidden="true">
              {course.shortName.slice(0, 2).toUpperCase()}
            </span>
            <div>
              <p className="eyebrow">{course.eyebrow}</p>
              <h1>{course.name}</h1>
            </div>
          </div>
          <p className="course-lead">{course.description}</p>
          <div className="course-summary">
            <span><strong>{course.lessonCount}</strong> lessons</span>
            <span><strong>{course.levelCount}</strong> {course.levelCount === 1 ? "level" : "levels"}</span>
            <span><strong>{course.status}</strong> status</span>
          </div>
          {course.firstLesson ? (
            <Link className="button button-primary" href={course.firstLesson}>
              Begin this course <span aria-hidden="true">→</span>
            </Link>
          ) : (
            <p className="mapped-note">The full path is mapped. Lesson publishing is in progress.</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="shell narrow-shell">
          <div className="course-levels">
            {course.levels.map((level) => (
              <section key={`${level.label}-${level.title}`} className="course-level">
                <div className="level-heading">
                  <span>{level.label}</span>
                  <div>
                    <h2>{level.title}</h2>
                    <p>{level.description}</p>
                  </div>
                </div>

                {level.lessons.length ? (
                  <ol className="lesson-list">
                    {level.lessons.map((lesson, index) => (
                      <li key={lesson.title}>
                        <span className="lesson-index">{String(index + 1).padStart(2, "0")}</span>
                        <div>
                          {lesson.slug ? (
                            <Link href={`/lessons/${lesson.slug}`}>{lesson.title}</Link>
                          ) : (
                            <strong>{lesson.title}</strong>
                          )}
                          <small>{lesson.duration}</small>
                        </div>
                        <span className={lesson.slug ? "lesson-live" : "lesson-planned"}>
                          {lesson.slug ? "Start" : "Planned"}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <div className="empty-lessons">
                    <strong>Lesson titles are being prepared.</strong>
                    <p>The outcome and sequence are already locked for this level.</p>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
