"use client";

import { useState } from "react";

import { useLessonProgress } from "@/components/guided-lesson-flow";

const signalStops = [
  {
    id: "source",
    label: "Source code",
    description: "The instruction you write.",
    symbol: "{ }",
  },
  {
    id: "runtime",
    label: "Runtime",
    description: "The software that runs it.",
    symbol: "▶",
  },
  {
    id: "output",
    label: "Output",
    description: "The result you can see.",
    symbol: "✓",
  },
] as const;

const pickerOrder = [signalStops[2], signalStops[0], signalStops[1]];
const correctOrder = signalStops.map((stop) => stop.id);

type SignalPathChallengeProps = {
  stepId: string;
};

export function SignalPathChallenge({ stepId }: SignalPathChallengeProps) {
  const {
    attemptsByStep,
    practiceCompletedIds,
    completePractice,
    recordFailedAttempt,
  } = useLessonProgress();
  const completed = practiceCompletedIds.includes(stepId);
  const attempts = attemptsByStep[stepId] ?? 0;
  const [selectedIds, setSelectedIds] = useState<string[]>(
    completed ? [...correctOrder] : [],
  );
  const [feedback, setFeedback] = useState(
    completed
      ? "Signal connected: write the instruction, let the runtime run it, then inspect the output."
      : "",
  );
  const displayedIds = completed && selectedIds.length === 0 ? [...correctOrder] : selectedIds;
  const displayedFeedback =
    completed && !feedback
      ? "Signal connected: write the instruction, let the runtime run it, then inspect the output."
      : feedback;
  const showHint = attempts >= 3 && !completed;

  function chooseStop(id: string) {
    if (completed || selectedIds.includes(id) || selectedIds.length >= 3) {
      return;
    }

    setSelectedIds((current) => [...current, id]);
    setFeedback("");
  }

  function checkPath() {
    if (completed || selectedIds.length !== correctOrder.length) {
      return;
    }

    const correct = selectedIds.every((id, index) => id === correctOrder[index]);

    if (correct) {
      completePractice(stepId);
      setFeedback(
        "Signal connected: write the instruction, let the runtime run it, then inspect the output.",
      );
      return;
    }

    recordFailedAttempt(stepId);
    setFeedback("That signal would get lost. Clear the path and follow what happens from writing to result.");
  }

  function clearPath() {
    if (completed) {
      return;
    }

    setSelectedIds([]);
    setFeedback("");
  }

  return (
    <section className="signal-path-challenge" aria-labelledby={`${stepId}-path-title`}>
      <div className="signal-path-heading">
        <div>
          <p className="eyebrow">Build it yourself</p>
          <h3 id={`${stepId}-path-title`}>Connect the three stops</h3>
        </div>
        <span className={completed ? "is-passed" : undefined}>
          <i aria-hidden="true">{completed ? "✓" : "↗"}</i>
          {completed ? "Connected" : "Your turn"}
        </span>
      </div>

      <p className="signal-path-instructions">
        Tap the cards in the order a message travels. The first card should be what you write.
      </p>

      <div className="signal-path-slots" aria-label="Your signal path" aria-live="polite">
        {[0, 1, 2].map((index) => {
          const selected = signalStops.find((stop) => stop.id === displayedIds[index]);

          return (
            <div className={selected ? "is-filled" : undefined} key={index}>
              <span>{index + 1}</span>
              {selected ? (
                <strong>{selected.label}</strong>
              ) : (
                <small>Choose a stop</small>
              )}
            </div>
          );
        })}
      </div>

      <div className="signal-path-picker" aria-label="Available signal stops">
        {pickerOrder.map((stop) => {
          const selected = displayedIds.includes(stop.id);

          return (
            <button
              type="button"
              key={stop.id}
              disabled={completed || selected}
              className={selected ? "is-selected" : undefined}
              onClick={() => chooseStop(stop.id)}
            >
              <span aria-hidden="true">{stop.symbol}</span>
              <strong>{stop.label}</strong>
              <small>{stop.description}</small>
            </button>
          );
        })}
      </div>

      <div className="signal-path-actions">
        <button
          className="button button-primary"
          type="button"
          disabled={completed || selectedIds.length !== correctOrder.length}
          onClick={checkPath}
        >
          {completed ? "Path connected" : "Test my path"}
        </button>
        <button
          className="button button-secondary"
          type="button"
          disabled={completed || selectedIds.length === 0}
          onClick={clearPath}
        >
          Clear path
        </button>
      </div>

      {displayedFeedback ? (
        <div className={`signal-path-feedback${completed ? " is-correct" : ""}`} role="status">
          <span aria-hidden="true">{completed ? "✓" : "↳"}</span>
          <p>{displayedFeedback}</p>
        </div>
      ) : null}

      {showHint ? (
        <div className="practice-hint" role="note" aria-live="polite">
          <span aria-hidden="true">💡</span>
          <p>
            <strong>Hint unlocked:</strong> You write source code. A runtime runs it. Output comes last.
          </p>
        </div>
      ) : null}
    </section>
  );
}
