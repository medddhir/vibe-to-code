"use client";

import Link from "next/link";
import {
  Children,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useSyncExternalStore,
  type ReactNode,
} from "react";

export type GuidedLessonStep = {
  id: string;
  title: string;
  eyebrow: string;
  requiresPractice?: boolean;
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
  saveCode: (stepId: string, code: string) => void;
};

const LessonProgressContext = createContext<LessonProgressContextValue | null>(null);
const inMemoryProgress = new Map<string, string>();
const memoryOnlyProgress = new Set<string>();
const lessonProgressEvent = "vibe-to-code:lesson-progress";

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

    return {
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
  children,
}: GuidedLessonFlowProps) {
  const panels = Children.toArray(children);
  const firstStepId = steps[0]?.id ?? "start";
  const storageKey = `vibe-to-code:lesson-progress:v1:${lessonId}:lesson-v${lessonVersion}`;
  const knownIds = useMemo(() => new Set(steps.map((step) => step.id)), [steps]);
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
    () => restoreProgress(serializedProgress, firstStepId, knownIds, lessonVersion),
    [firstStepId, knownIds, lessonVersion, serializedProgress],
  );
  const panelStartRef = useRef<HTMLDivElement>(null);

  const updateProgress = useCallback(
    (updater: (current: LessonProgress) => LessonProgress) => {
      const current = restoreProgress(
        readProgressSnapshot(storageKey),
        firstStepId,
        knownIds,
        lessonVersion,
      );
      writeProgressSnapshot(storageKey, JSON.stringify(updater(current)));
    },
    [firstStepId, knownIds, lessonVersion, storageKey],
  );

  const activeIndex = Math.max(
    0,
    steps.findIndex((step) => step.id === progress.currentStepId),
  );
  const activeStep = steps[activeIndex] ?? steps[0];
  const activePracticeComplete = activeStep
    ? progress.practiceCompletedIds.includes(activeStep.id)
    : true;
  const canContinue = !activeStep?.requiresPractice || activePracticeComplete;
  const isFinalStep = activeIndex === steps.length - 1;
  const lessonCompleted = Boolean(progress.completedAt);
  const lessonStepPercent = steps.length ? ((activeIndex + 1) / steps.length) * 100 : 0;
  const coursePercent = (lessonNumber / totalLessons) * 100;

  const moveToStep = useCallback((stepId: string) => {
    updateProgress((current) => ({ ...current, currentStepId: stepId }));
    window.requestAnimationFrame(() => {
      panelStartRef.current?.scrollIntoView({ behavior: "auto", block: "start" });
      panelStartRef.current?.focus({ preventScroll: true });
    });
  }, [updateProgress]);

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
    [knownIds, progress.attemptsByStep, progress.practiceCompletedIds, progress.savedCodeByStep, updateProgress],
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
            <span aria-hidden="true">{complete ? "✓" : String(index + 1).padStart(2, "0")}</span>
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
            <p className="eyebrow">{levelLabel} · Lesson {lessonNumber}</p>
            <p className="lesson-sidebar-title">{title}</p>
            <div
              className="lesson-progress"
              role="progressbar"
              aria-label="Course progress"
              aria-valuemin={0}
              aria-valuemax={totalLessons}
              aria-valuenow={lessonNumber}
              aria-valuetext={`Lesson ${lessonNumber} of ${totalLessons}`}
            >
              <span style={{ width: `${coursePercent}%` }} />
            </div>
            <small>{lessonNumber} of {totalLessons} course lessons</small>

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
                <span aria-hidden="true">↳</span>
                <p><strong>The next {stepNoun.toLowerCase()} is locked for now.</strong> Clear this checkpoint, then the button will unlock.</p>
              </div>
            ) : null}

            {lessonCompleted && isFinalStep ? (
              <section className="lesson-complete-card" aria-live="polite">
                <span aria-hidden="true">✓</span>
                <div>
                  <p className="eyebrow">{completionEyebrow}</p>
                  <h2>{completionTitle}</h2>
                  <p>{completionDescription}</p>
                  {completionReward ? <strong className="lesson-complete-reward">{completionReward}</strong> : null}
                  <Link className="button button-primary" href={`${courseHref}#level-1`}>
                    Return to the course map
                  </Link>
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
