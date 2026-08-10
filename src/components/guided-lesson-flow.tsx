"use client";

import Link from "next/link";
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  markLessonCompleted,
  recordCompletedCheckpoint,
  recordLessonAttempt,
  recordLessonHint,
  resetLessonProgress,
  setCurrentCheckpoint,
  setCurrentLesson,
} from "@/lib/course-progress";
import {
  FOUNDATION_PUBLISHED_TOTAL_LESSONS,
  getFoundationLessonJourney,
} from "@/data/foundations-level1";

export type GuidedLessonStep = {
  id: string;
  title: string;
  eyebrow: string;
  requiresPractice?: boolean;
  requiredActivityIds?: string[];
  continueLabel?: string;
};

type LessonProgress = {
  version: 1;
  lessonVersion: number;
  currentStepId: string;
  completedStepIds: string[];
  practiceCompletedIds: string[];
  attemptsByStep: Record<string, number>;
  savedCodeByStep: Record<string, string>;
  completedAt: string | null;
};

type LessonProgressContextValue = {
  attemptsByStep: Record<string, number>;
  savedCodeByStep: Record<string, string>;
  practiceCompletedIds: string[];
  completePractice: (stepId: string) => void;
  recordFailedAttempt: (stepId: string) => void;
  recordHintUsage: (stepId: string) => void;
  saveCode: (stepId: string, code: string) => void;
};

const LessonProgressContext = createContext<LessonProgressContextValue | null>(null);
const inMemoryProgress = new Map<string, string>();
const memoryOnlyProgress = new Set<string>();
const lessonProgressEvent = "vibe-to-code:lesson-progress";

export const getLessonStorageKey = (lessonId: string, lessonVersion: number) =>
  `vibe-to-code:lesson-progress:v1:${lessonId}:lesson-v${lessonVersion}`;

function getRequiredActivityIds(step: GuidedLessonStep) {
  return step.requiresPractice
    ? step.requiredActivityIds?.length
      ? [...new Set(step.requiredActivityIds)]
      : [step.id]
    : [];
}

export function isActivityCompleteForStep(
  _step: GuidedLessonStep,
  practiceCompletedIds: readonly string[],
  activityId: string,
) {
  return practiceCompletedIds.includes(activityId);
}

export function isStepPracticeActivitiesComplete(
  step: GuidedLessonStep,
  practiceCompletedIds: readonly string[],
) {
  return getRequiredActivityIds(step).every((activityId) =>
    isActivityCompleteForStep(step, practiceCompletedIds, activityId),
  );
}

function collectKnownIds(steps: GuidedLessonStep[]) {
  const knownIds = new Set<string>();
  steps.forEach((step) => {
    knownIds.add(step.id);
    step.requiredActivityIds?.forEach((id) => knownIds.add(id));
  });
  return knownIds;
}

function migrateLegacyStepCompletion(
  step: GuidedLessonStep,
  practiceCompletedIds: string[],
) {
  const requiredIds = getRequiredActivityIds(step);
  if (!requiredIds.length || !practiceCompletedIds.includes(step.id)) {
    return practiceCompletedIds;
  }

  if (requiredIds.every((id) => practiceCompletedIds.includes(id))) {
    return practiceCompletedIds;
  }

  const next = new Set(practiceCompletedIds);
  requiredIds.forEach((id) => next.add(id));
  return [...next];
}

function readProgressSnapshot(storageKey: string) {
  if (typeof window === "undefined") {
    return "";
  }

  if (memoryOnlyProgress.has(storageKey)) {
    return inMemoryProgress.get(storageKey) ?? "";
  }

  try {
    return localStorage.getItem(storageKey) ?? inMemoryProgress.get(storageKey) ?? "";
  } catch {
    memoryOnlyProgress.add(storageKey);
    return inMemoryProgress.get(storageKey) ?? "";
  }
}

function writeProgressSnapshot(storageKey: string, value: string) {
  inMemoryProgress.set(storageKey, value);

  try {
    localStorage.setItem(storageKey, value);
  } catch {
    memoryOnlyProgress.add(storageKey);
    // The in-memory copy keeps the lesson usable when storage is blocked or full.
  }

  window.dispatchEvent(
    new CustomEvent(lessonProgressEvent, { detail: { storageKey } }),
  );
}

function subscribeToProgress(storageKey: string, callback: () => void) {
  function handleLocalProgress(event: Event) {
    const detail = (event as CustomEvent<{ storageKey?: string }>).detail;
    if (detail?.storageKey === storageKey) {
      callback();
    }
  }

  function handleStorage(event: StorageEvent) {
    if (event.key === storageKey) {
      callback();
    }
  }

  window.addEventListener(lessonProgressEvent, handleLocalProgress);
  window.addEventListener("storage", handleStorage);
  return () => {
    window.removeEventListener(lessonProgressEvent, handleLocalProgress);
    window.removeEventListener("storage", handleStorage);
  };
}

export function useLessonProgress() {
  const value = useContext(LessonProgressContext);

  if (!value) {
    throw new Error("useLessonProgress must be used inside GuidedLessonFlow");
  }

  return value;
}

type GuidedLessonFlowProps = {
  lessonId: string;
  lessonVersion?: number;
  courseHref: string;
  courseName: string;
  levelLabel: string;
  lessonNumber: number;
  totalLessons: number;
  courseLessonNumber?: number;
  courseTotalLessons?: number;
  title: string;
  estimatedMinutes: number;
  steps: GuidedLessonStep[];
  stepNoun?: string;
  progressLabel?: string;
  finalButtonLabel?: string;
  completionEyebrow?: string;
  completionTitle?: string;
  completionDescription?: string;
  completionReward?: string;
  courseSlug?: string;
  lessonProgressSlug?: string;
  nextLesson?: {
    href: string;
    title: string;
    eyebrow: string;
    actionLabel: string;
  };
  children: ReactNode;
};

function createDefaultProgress(
  firstStepId: string,
  lessonVersion: number,
): LessonProgress {
  return {
    version: 1,
    lessonVersion,
    currentStepId: firstStepId,
    completedStepIds: [],
    practiceCompletedIds: [],
    attemptsByStep: {},
    savedCodeByStep: {},
    completedAt: null,
  };
}

function uniqueKnownIds(ids: unknown, knownIds: Set<string>) {
  if (!Array.isArray(ids)) {
    return [];
  }

  return [...new Set(ids.filter((id): id is string => typeof id === "string" && knownIds.has(id)))];
}

function restoreProgress(
  storedValue: string | null,
  firstStepId: string,
  knownIds: Set<string>,
  lessonVersion: number,
  stepDefinitions: GuidedLessonStep[],
): LessonProgress {
  const fallback = createDefaultProgress(firstStepId, lessonVersion);

  if (!storedValue) {
    return fallback;
  }

  try {
    const stored = JSON.parse(storedValue) as Partial<LessonProgress>;

    if (stored.version !== 1 || stored.lessonVersion !== lessonVersion) {
      return fallback;
    }

    const currentStepId =
      typeof stored.currentStepId === "string" && knownIds.has(stored.currentStepId)
        ? stored.currentStepId
        : firstStepId;

    const baseProgress = {
      ...fallback,
      currentStepId,
      completedStepIds: uniqueKnownIds(stored.completedStepIds, knownIds),
      practiceCompletedIds: uniqueKnownIds(stored.practiceCompletedIds, knownIds),
      attemptsByStep:
        stored.attemptsByStep && typeof stored.attemptsByStep === "object"
          ? Object.fromEntries(
              Object.entries(stored.attemptsByStep).filter(
                ([id, attempts]) =>
                  knownIds.has(id) &&
                  typeof attempts === "number" &&
                  Number.isFinite(attempts) &&
                  attempts >= 0,
              ),
            )
          : {},
      savedCodeByStep:
        stored.savedCodeByStep && typeof stored.savedCodeByStep === "object"
          ? Object.fromEntries(
              Object.entries(stored.savedCodeByStep).filter(
                ([id, code]) => knownIds.has(id) && typeof code === "string",
              ),
            )
          : {},
      completedAt: typeof stored.completedAt === "string" ? stored.completedAt : null,
    };

    return {
      ...baseProgress,
      practiceCompletedIds: uniqueKnownIds(
        stepDefinitions.reduce((acc, step) => migrateLegacyStepCompletion(step, acc), baseProgress.practiceCompletedIds),
        knownIds,
      ),
    };
  } catch {
    return fallback;
  }
}

export function GuidedLessonFlow({
  lessonId,
  lessonVersion = 1,
  courseHref,
  courseName,
  levelLabel,
  lessonNumber,
  totalLessons,
  title,
  estimatedMinutes,
  steps,
  stepNoun = "Topic",
  progressLabel = "Lesson progress",
  finalButtonLabel = "Complete lesson",
  completionEyebrow = "Lesson complete",
  completionTitle = "You understood your first piece of code.",
  completionDescription = "Your progress is saved on this device. The next lesson is being prepared carefully.",
  completionReward,
  courseLessonNumber,
  courseTotalLessons,
  courseSlug,
  lessonProgressSlug,
  nextLesson,
  children,
}: GuidedLessonFlowProps) {
  const panels = Children.toArray(children);
  const firstStepId = steps[0]?.id ?? "start";
  const storageKey = getLessonStorageKey(lessonId, lessonVersion);
  const hasCourseTracking = Boolean(courseSlug && lessonProgressSlug);
  const knownIds = useMemo(() => collectKnownIds(steps), [steps]);
  const subscribe = useCallback(
    (callback: () => void) => subscribeToProgress(storageKey, callback),
    [storageKey],
  );
  const getSnapshot = useCallback(() => readProgressSnapshot(storageKey), [storageKey]);
  const getServerSnapshot = useCallback(() => "", []);
  const serializedProgress = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );
  const progress = useMemo(
    () => restoreProgress(serializedProgress, firstStepId, knownIds, lessonVersion, steps),
    [firstStepId, knownIds, lessonVersion, serializedProgress, steps],
  );
  const panelStartRef = useRef<HTMLDivElement>(null);

  const updateProgress = useCallback(
    (updater: (current: LessonProgress) => LessonProgress) => {
      const current = restoreProgress(
        readProgressSnapshot(storageKey),
        firstStepId,
        knownIds,
        lessonVersion,
        steps,
      );
      writeProgressSnapshot(storageKey, JSON.stringify(updater(current)));
    },
    [firstStepId, knownIds, lessonVersion, storageKey, steps],
  );

  const foundationJourney = courseSlug === "foundations" && lessonProgressSlug
    ? getFoundationLessonJourney(lessonProgressSlug)
    : null;
  const courseLessonProgressValue = foundationJourney?.current.courseNumber
    ?? courseLessonNumber
    ?? lessonNumber;
  const courseLessonTotalValue = foundationJourney
    ? FOUNDATION_PUBLISHED_TOTAL_LESSONS
    : courseTotalLessons ?? totalLessons;
  const automaticNextLesson = foundationJourney?.next
    ? {
        href: `/lessons/${foundationJourney.next.lesson.slug}`,
        title: foundationJourney.next.lesson.title,
        eyebrow: foundationJourney.startsNextLevel
          ? `${foundationJourney.next.levelLabel} unlocked`
          : `Next · ${foundationJourney.next.levelLabel} lesson ${foundationJourney.next.number}`,
        actionLabel: foundationJourney.startsNextLevel
          ? `Start ${foundationJourney.next.levelLabel}`
          : "Continue to next lesson",
      }
    : undefined;
  const resolvedNextLesson = nextLesson ?? automaticNextLesson;

  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === progress.currentStepId),
  );
  const activeStep = steps[activeIndex] ?? steps[0];
  const activePracticeComplete = activeStep
    ? isStepPracticeActivitiesComplete(activeStep, progress.practiceCompletedIds)
    : true;
  const canContinue = !activeStep?.requiresPractice || activePracticeComplete;
  const isFinalStep = activeIndex === steps.length - 1;
  const lessonCompleted = Boolean(progress.completedAt);
  const lessonStepPercent = steps.length ? ((activeIndex + 1) / steps.length) * 100 : 0;
  const coursePercent = (courseLessonProgressValue / courseLessonTotalValue) * 100;

  const trackCourseStep = useCallback(
    (stepId: string) => {
      if (!hasCourseTracking || !courseSlug || !lessonProgressSlug) {
        return;
      }

      setCurrentCheckpoint(courseSlug, lessonProgressSlug, stepId);
      setCurrentLesson(courseSlug, lessonProgressSlug);
    },
    [courseSlug, hasCourseTracking, lessonProgressSlug],
  );

  useEffect(() => {
    if (activeStep && hasCourseTracking) {
      trackCourseStep(activeStep.id);
    }
  }, [activeStep, hasCourseTracking, trackCourseStep]);

  const finalStepId = steps.at(-1)?.id;

  useEffect(() => {
    if (
      lessonCompleted &&
      finalStepId &&
      courseSlug &&
      lessonProgressSlug
    ) {
      markLessonCompleted(courseSlug, lessonProgressSlug, finalStepId);
    }
  }, [
    courseSlug,
    finalStepId,
    lessonCompleted,
    lessonProgressSlug,
  ]);

  const moveToStep = useCallback((stepId: string) => {
    updateProgress((current) => ({ ...current, currentStepId: stepId }));
    trackCourseStep(stepId);
    window.requestAnimationFrame(() => {
      panelStartRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      panelStartRef.current?.focus({ preventScroll: true });
    });
  }, [trackCourseStep, updateProgress]);

  const isStepUnlocked = useCallback(
    (index: number) => {
      if (index === 0) {
        return true;
      }

      return progress.completedStepIds.includes(steps[index - 1].id);
    },
    [progress.completedStepIds, steps],
  );

  function goBack() {
    if (activeIndex > 0) {
      moveToStep(steps[activeIndex - 1].id);
    }
  }

  function goForward() {
    if (!activeStep || !canContinue) {
      return;
    }

    updateProgress((current) => {
      const completedStepIds = current.completedStepIds.includes(activeStep.id)
        ? current.completedStepIds
        : [...current.completedStepIds, activeStep.id];

      if (isFinalStep) {
        if (courseSlug && lessonProgressSlug) {
          markLessonCompleted(courseSlug, lessonProgressSlug, activeStep.id);
        }

        return {
          ...current,
          completedStepIds,
          completedAt: current.completedAt ?? new Date().toISOString(),
        };
      }

      return {
        ...current,
        completedStepIds,
        currentStepId: steps[activeIndex + 1].id,
      };
    });

    if (!isFinalStep) {
      window.requestAnimationFrame(() => {
        panelStartRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
        panelStartRef.current?.focus({ preventScroll: true });
      });
    }
  }

  function resetProgress() {
    if (!window.confirm("Reset this lesson and erase its saved progress on this device?")) {
      return;
    }

    writeProgressSnapshot(
      storageKey,
      JSON.stringify(createDefaultProgress(firstStepId, lessonVersion)),
    );
    if (courseSlug && lessonProgressSlug) {
      resetLessonProgress(courseSlug, lessonProgressSlug);
    }
    window.requestAnimationFrame(() => {
      panelStartRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      panelStartRef.current?.focus({ preventScroll: true });
    });
  }

  const contextValue = useMemo<LessonProgressContextValue>(
    () => ({
      attemptsByStep: progress.attemptsByStep,
      savedCodeByStep: progress.savedCodeByStep,
      practiceCompletedIds: progress.practiceCompletedIds,
      completePractice: (stepId) => {
        if (!knownIds.has(stepId)) {
          return;
        }
        updateProgress((current) => ({
          ...current,
          practiceCompletedIds: current.practiceCompletedIds.includes(stepId)
            ? current.practiceCompletedIds
            : [...current.practiceCompletedIds, stepId],
        }));

        if (courseSlug && lessonProgressSlug) {
          recordCompletedCheckpoint(courseSlug, lessonProgressSlug, stepId);
        }
      },
      recordFailedAttempt: (stepId) => {
        if (!knownIds.has(stepId)) {
          return;
        }
        updateProgress((current) => ({
          ...current,
          attemptsByStep: {
            ...current.attemptsByStep,
            [stepId]: (current.attemptsByStep[stepId] ?? 0) + 1,
          },
        }));

        if (courseSlug && lessonProgressSlug) {
          recordLessonAttempt(courseSlug, lessonProgressSlug, stepId);
        }
      },
      recordHintUsage: (stepId) => {
        if (!knownIds.has(stepId) || !courseSlug || !lessonProgressSlug) {
          return;
        }

        recordLessonHint(courseSlug, lessonProgressSlug, stepId);
      },
      saveCode: (stepId, code) => {
        if (!knownIds.has(stepId)) {
          return;
        }
        updateProgress((current) => ({
          ...current,
          savedCodeByStep: { ...current.savedCodeByStep, [stepId]: code.slice(0, 10_000) },
        }));
      },
    }),
    [
      knownIds,
      courseSlug,
      lessonProgressSlug,
      progress.attemptsByStep,
      progress.practiceCompletedIds,
      progress.savedCodeByStep,
      updateProgress,
    ],
  );

  if (!activeStep || panels.length !== steps.length) {
    return null;
  }

  const stepNavigation = (
    <nav className="lesson-step-nav" aria-label={`${progressLabel} checkpoints`}>
      {steps.map((step, index) => {
        const complete = progress.completedStepIds.includes(step.id);
        const active = index === activeIndex;
        const unlocked = isStepUnlocked(index);
        const stateClassName = [active ? "is-active" : "", complete ? "is-complete" : ""]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={step.id}
            type="button"
            className={stateClassName || undefined}
            disabled={!unlocked}
            aria-current={active ? "step" : undefined}
            onClick={() => moveToStep(step.id)}
          >
            <span aria-hidden="true">
              {complete ? (
                <svg viewBox="0 0 16 16" focusable="false">
                  <path d="m3.25 8.15 2.75 2.7 6.75-6.1" />
                </svg>
              ) : String(index + 1).padStart(2, "0")}
            </span>
            <span>
              <small>{step.eyebrow}</small>
              <strong>{step.title}</strong>
            </span>
            {!unlocked ? (
              <i aria-label={`Locked until the previous ${stepNoun.toLowerCase()} is complete`}>
                Locked
              </i>
            ) : null}
          </button>
        );
      })}
    </nav>
  );

  return (
    <LessonProgressContext.Provider value={contextValue}>
      <main id="main-content" className="lesson-main guided-lesson-main">
        <div className="shell lesson-shell guided-lesson-shell">
          <aside className="lesson-sidebar guided-lesson-sidebar" aria-label="Lesson progress">
            <Link className="breadcrumb" href={courseHref}>
              ← {courseName}
            </Link>
            <p className="eyebrow">
              {levelLabel} · Lesson {lessonNumber} of {totalLessons}
            </p>
            <p className="lesson-sidebar-title">{title}</p>
            <div
              className="lesson-progress"
              role="progressbar"
              aria-label="Course progress"
              aria-valuemin={0}
              aria-valuemax={courseLessonTotalValue}
              aria-valuenow={courseLessonProgressValue}
              aria-valuetext={`Course lesson ${courseLessonProgressValue} of ${courseLessonTotalValue}`}
            >
              <span style={{ width: `${coursePercent}%` }} />
            </div>
            <small>
              Course lesson {courseLessonProgressValue} of {courseLessonTotalValue}
            </small>

            <div className="lesson-topic-summary">
              <span>{progressLabel}</span>
              <strong>{activeIndex + 1}/{steps.length}</strong>
            </div>
            {stepNavigation}

            <details className="lesson-mobile-toc">
              <summary>{stepNoun} {activeIndex + 1} of {steps.length}</summary>
              {stepNavigation}
            </details>

            <button className="lesson-reset" type="button" onClick={resetProgress}>
              Reset lesson progress
            </button>
          </aside>

          <article className="lesson-article guided-lesson-article">
            <h1 className="lesson-persistent-title">{title}</h1>
            <div
              className="lesson-panel-start"
              ref={panelStartRef}
              tabIndex={-1}
              aria-label={`${stepNoun} ${activeIndex + 1}: ${activeStep.title}`}
            >
              <div className="lesson-active-progress">
                <div>
                  <span>{activeStep.eyebrow}</span>
                  <strong>{stepNoun} {activeIndex + 1} of {steps.length}</strong>
                </div>
                <div
                  className="lesson-progress"
                  role="progressbar"
                  aria-label="Current lesson progress"
                  aria-valuemin={1}
                  aria-valuemax={steps.length}
                  aria-valuenow={activeIndex + 1}
                >
                  <span style={{ width: `${lessonStepPercent}%` }} />
                </div>
                <small>About {estimatedMinutes} minutes total · Progress saves on this device</small>
              </div>
            </div>

            <div className="guided-lesson-panel" key={activeStep.id}>
              {panels[activeIndex]}
            </div>

            {activeStep.requiresPractice && !activePracticeComplete ? (
              <div className="lesson-gate-note" role="status">
                <p><strong>The next {stepNoun.toLowerCase()} is locked for now.</strong> Clear this checkpoint, then the button will unlock.</p>
              </div>
            ) : null}

            {lessonCompleted && isFinalStep ? (
              <section className="lesson-complete-card" aria-live="polite">
                <div>
                  <p className="completion-status">{completionEyebrow}</p>
                  <h2>{completionTitle}</h2>
                  <p>{completionDescription}</p>
                  {completionReward ? <strong className="lesson-complete-reward">{completionReward}</strong> : null}
                  {resolvedNextLesson ? (
                    <div className="lesson-next-handoff">
                      <span>{resolvedNextLesson.eyebrow}</span>
                      <strong>{resolvedNextLesson.title}</strong>
                    </div>
                  ) : null}
                  <div className="lesson-complete-actions">
                    {resolvedNextLesson ? (
                      <Link className="button button-primary" href={resolvedNextLesson.href}>
                        {resolvedNextLesson.actionLabel}
                        <svg className="button-icon" viewBox="0 0 16 16" aria-hidden="true" focusable="false">
                          <path d="M3 8h9M8.5 4.5 12 8l-3.5 3.5" />
                        </svg>
                      </Link>
                    ) : null}
                    <Link
                      className={resolvedNextLesson ? "button button-secondary" : "button button-primary"}
                      href={courseHref}
                    >
                      View course map
                    </Link>
                  </div>
                </div>
              </section>
            ) : (
              <nav className="guided-lesson-navigation" aria-label="Lesson topic navigation">
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={activeIndex === 0}
                  onClick={goBack}
                >
                  ← Previous topic
                </button>
                <div>
                  {!canContinue ? <small>Clear the checkpoint above to continue</small> : null}
                  <button
                    className="button button-primary"
                    type="button"
                    disabled={!canContinue}
                    onClick={goForward}
                  >
                    {isFinalStep
                      ? finalButtonLabel
                      : activeStep.continueLabel ?? `Next ${stepNoun.toLowerCase()}`} →
                  </button>
                </div>
              </nav>
            )}
          </article>
        </div>
      </main>
    </LessonProgressContext.Provider>
  );
}
