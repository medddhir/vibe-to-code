import Link from "next/link";

import { modelFamilies } from "@/data/course-content";
import type { Course } from "@/data/curriculum";
import { FoundationCourseProgressPanel } from "@/components/foundations/foundation-course-progress-panel";

const learningLoop = [
  { number: "01", title: "Understand", description: "Start with one plain-English mental model." },
  { number: "02", title: "See", description: "Compare a real example with its visible result." },
  { number: "03", title: "Try", description: "Make one small change and predict what happens." },
  { number: "04", title: "Break + verify", description: "Repair a mistake and prove the fix with evidence." },
];

function BasicCourse({ course }: { course: Course }) {
  return (
    <>
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
              <span className="course-discipline">{course.eyebrow}</span>
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
    </>
  );
}

function CourseLearningLoop() {
  return (
    <section className="section section-soft course-method" aria-labelledby="course-method-title">
      <div className="shell">
        <div className="section-heading compact-heading">
          <div>
            <h2 id="course-method-title">A familiar route through every new idea.</h2>
          </div>
          <p>Every lesson follows the same calm loop, so new concepts feel familiar.</p>
        </div>
        <ol className="course-stepper">
          {learningLoop.map((step) => (
            <li key={step.number}>
              <span>{step.number}</span>
              <div>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ModelAtlas({ updatedAt }: { updatedAt: string }) {
  return (
    <section className="section model-atlas-section" aria-labelledby="model-atlas-title">
      <div className="shell">
        <div className="model-atlas-heading">
          <div>
            <h2 id="model-atlas-title">Learn the landscape, not a temporary ranking.</h2>
          </div>
          <div className="atlas-note">
            <strong>Representative, not exhaustive</strong>
            <span>Last verified {updatedAt}. Always check the live official catalog.</span>
          </div>
        </div>
        <div className="model-atlas-grid">
          {modelFamilies.map((model) => (
            <article key={`${model.region}-${model.provider}`} className="model-family-card">
              <div className="model-family-topline">
                <span>{model.region}</span>
                <a href={model.source} target="_blank" rel="noreferrer" aria-label={`Open ${model.provider} official source`}>
                  Official source <span aria-hidden="true">↗</span>
                </a>
              </div>
              <h3>{model.provider}</h3>
              <strong>{model.families}</strong>
              <p>{model.usefulFor}</p>
              <div className="model-reminder">
                <span>Remember</span>
                <p>{model.remember}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function DetailedCourse({ course }: { course: Course }) {
  const levelOffsets: number[] = [];
  let lessonOffset = 0;

  for (const level of course.levels) {
    levelOffsets.push(lessonOffset);
    lessonOffset += level.lessons.length;
  }

  return (
    <>
      <section className={`course-hero course-hero-detailed section course-accent-${course.accent}`}>
        <div className="retro-grid" aria-hidden="true" />
        <div className="shell course-hero-shell">
          <Link className="breadcrumb" href="/learn">
            ← All courses
          </Link>
          <div className="course-hero-grid">
            <div className="course-hero-copy">
              <div className="course-kicker">
                <span className="course-symbol" aria-hidden="true">{course.shortName.slice(0, 2).toUpperCase()}</span>
                <span className="course-discipline">{course.eyebrow}</span>
              </div>
              <h1>{course.name}</h1>
              <p className="course-lead">{course.description}</p>
              <div className="course-hero-actions">
                {course.firstLesson ? (
                  <Link className="button button-primary" href={course.firstLesson}>
                    Start lesson one <span aria-hidden="true">→</span>
                  </Link>
                ) : (
                  <a className="button button-primary" href="#course-levels">
                    Explore the full map <span aria-hidden="true">↓</span>
                  </a>
                )}
                <a className="button button-secondary" href="#course-outcomes">See what you will build</a>
              </div>
            </div>

            <aside className="course-glance glow-card" aria-label="Course at a glance">
              <div className="typing-demo" aria-hidden="true">
                <span>&gt;</span> open learning-path
                <i />
              </div>
              <div className="course-glance-stats">
                <div><strong>{course.lessonCount}</strong><span>lessons</span></div>
                <div><strong>{course.levelCount}</strong><span>levels</span></div>
                <div><strong>₹0</strong><span>forever</span></div>
              </div>
              <div className="beam-flow" aria-label="The course moves from understanding to shipping">
                {[
                  ["01", "Understand"],
                  ["02", "Build"],
                  ["03", "Verify"],
                  ["04", "Ship"],
                ].map(([number, label]) => (
                  <div key={number} className="beam-node">
                    <span>{number}</span>
                    <strong>{label}</strong>
                  </div>
                ))}
              </div>
              <p>{course.timeCommitment}</p>
              <small>Curriculum reviewed {course.updatedAt}</small>
            </aside>
          </div>
        </div>
      </section>

      <section className="course-facts-strip" aria-label="Course facts">
        <div className="shell">
          <div><span>Built for</span><strong>{course.audience}</strong></div>
          <div><span>Status</span><strong>{course.status}</strong></div>
          <div><span>Account needed</span><strong>No</strong></div>
        </div>
      </section>

      {course.slug === "foundations" ? (
        <section className="section course-progress-section">
          <div className="shell">
            <FoundationCourseProgressPanel levels={course.levels.slice(0, 2)} />
          </div>
        </section>
      ) : null}

      <section id="course-outcomes" className="section course-overview-section">
        <div className="shell course-overview-grid">
          <div>
            <h2>Not just watched. Understood and built.</h2>
            <div className="outcome-list">
              {course.outcomes?.map((outcome, index) => (
                <div key={outcome} className="animated-list-item" style={{ "--item-index": index } as React.CSSProperties}>
                  <span aria-hidden="true">✓</span>
                  <p>{outcome}</p>
                </div>
              ))}
            </div>
          </div>
          <aside className="course-prep-card">
            <span className="course-discipline">Before you start</span>
            <h3>No hidden prerequisites.</h3>
            <ul>
              {course.prerequisites?.map((prerequisite) => <li key={prerequisite}>{prerequisite}</li>)}
            </ul>
            <p className="course-prep-note">New words are explained when they first appear. You are never expected to pretend you understand.</p>
          </aside>
        </div>
      </section>

      <CourseLearningLoop />

      <section className="section course-projects-section" aria-labelledby="course-projects-title">
        <div className="shell">
          <div className="section-heading compact-heading">
            <div>
              <h2 id="course-projects-title">Build proof, not tutorial clutter.</h2>
            </div>
            <p>Each project produces something you can show, test, explain, and improve.</p>
          </div>
          <div className="project-ladder">
            {course.projects?.map((project, index) => (
              <article key={project.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{project.title}</h3>
                <p>{project.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {course.slug === "ai-assisted-development" ? <ModelAtlas updatedAt={course.updatedAt ?? "August 2026"} /> : null}

      <section id="course-levels" className="section course-map-section">
        <div className="shell course-map-shell">
          <div className="section-heading">
            <div>
              <h2>The complete course wiring.</h2>
            </div>
            <p>
              {course.slug === "foundations"
                ? "Level 0 and Level 1 are live. Complete each lesson to unlock the next; the handoff continues across the level boundary automatically."
                : "Open one level at a time. Only published lessons are marked Start; the rest are being written and tested."}
            </p>
          </div>

          <nav className="level-jump-nav" aria-label="Jump to a course level">
            {course.levels.map((level, index) => (
              <a key={level.title} href={`#level-${index + 1}`}>
                <span>{level.label}</span>
                <strong>{level.title}</strong>
              </a>
            ))}
          </nav>

          <div className="detailed-course-levels">
            {course.levels.map((level, levelIndex) => (
              <details
                key={`${level.label}-${level.title}`}
                id={`level-${levelIndex + 1}`}
                className="detailed-course-level"
                open={levelIndex === 0 || (course.slug === "foundations" && levelIndex === 1)}
              >
                <summary>
                  <span className="level-number">{level.label}</span>
                  <span className="level-summary-copy">
                    <span className="level-summary-title" role="heading" aria-level={3}>{level.title}</span>
                    <span className="level-summary-description">{level.description}</span>
                  </span>
                  <span className="level-lesson-count">{level.lessons.length} lessons</span>
                  <span className="level-toggle" aria-hidden="true">+</span>
                </summary>
                <ol className="detailed-lesson-list" start={levelOffsets[levelIndex] + 1}>
                  {level.lessons.map((item, lessonIndex) => {
                    const courseLessonNumber = levelOffsets[levelIndex] + lessonIndex + 1;

                    return (
                      <li key={item.title}>
                        <details className="lesson-outline">
                          <summary>
                            <span className="lesson-index">{String(courseLessonNumber).padStart(3, "0")}</span>
                            <span className="lesson-summary-copy">
                              <strong>{item.title}</strong>
                              <small>{item.duration}</small>
                            </span>
                            <span className={item.slug ? "lesson-live" : "lesson-planned"}>{item.slug ? "Start" : "Planned"}</span>
                            <span className="lesson-expand" aria-hidden="true">+</span>
                          </summary>
                          <div className="lesson-outline-body">
                            <div>
                              <span className="detail-label">Understand</span>
                              <p>{item.goal}</p>
                            </div>
                            <div>
                              <span className="detail-label">Try it</span>
                              <p>{item.practice}</p>
                            </div>
                            <div className="mistake-clinic">
                              <span className="detail-label">Common mistake</span>
                              <p>{item.mistake}</p>
                            </div>
                            {item.slug ? (
                              <Link className="lesson-start-link" href={`/lessons/${item.slug}`}>Open this lesson <span aria-hidden="true">→</span></Link>
                            ) : (
                              <small className="lesson-publishing-note">Detailed lesson page publishing in progress.</small>
                            )}
                          </div>
                        </details>
                      </li>
                    );
                  })}
                </ol>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft course-sources-section" aria-labelledby="course-sources-title">
        <div className="shell course-sources-grid">
          <div>
            <h2 id="course-sources-title">Built from maintained official guidance.</h2>
            <p>These links are starting points, not decoration. Model and software details are rechecked against official documentation before a lesson is published.</p>
          </div>
          <div className="course-source-list">
            {course.sources?.map((source) => (
              <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                <span><strong>{source.label}</strong><small>{source.note}</small></span>
                <span aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
        </div>
      </section>

    </>
  );
}

export function CourseOverview({ course }: { course: Course }) {
  const isDetailed = Boolean(course.outcomes?.length && course.projects?.length);
  return isDetailed ? <DetailedCourse course={course} /> : <BasicCourse course={course} />;
}
