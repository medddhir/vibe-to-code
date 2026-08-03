"use client";

import { useId, useState, type FormEvent } from "react";

import { useLessonProgress } from "@/components/guided-lesson-flow";

export type ChoiceCheckpointOption = {
  id: string;
  label: string;
  feedback: string;
};

type ChoiceCheckpointProps = {
  stepId: string;
  title: string;
  question: string;
  options: ChoiceCheckpointOption[];
  correctId: string;
  successMessage: string;
  hint: string;
};

export function ChoiceCheckpoint({
  stepId,
  title,
  question,
  options,
  correctId,
  successMessage,
  hint,
}: ChoiceCheckpointProps) {
  const {
    attemptsByStep,
    practiceCompletedIds,
    completePractice,
    recordFailedAttempt,
  } = useLessonProgress();
  const groupId = useId();
  const completed = practiceCompletedIds.includes(stepId);
  const attempts = attemptsByStep[stepId] ?? 0;
  const [selectedId, setSelectedId] = useState("");
  const [feedback, setFeedback] = useState("");
  const [answerCorrect, setAnswerCorrect] = useState(false);
  const displayedSelection = completed && !selectedId ? correctId : selectedId;
  const displayedFeedback = completed && !feedback ? successMessage : feedback;
  const showHint = attempts >= 3 && !completed;

  function checkAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedId || completed) {
      return;
    }

    if (selectedId === correctId) {
      completePractice(stepId);
      setAnswerCorrect(true);
      setFeedback(successMessage);
      return;
    }

    const selectedOption = options.find((option) => option.id === selectedId);
    recordFailedAttempt(stepId);
    setAnswerCorrect(false);
    setFeedback(selectedOption?.feedback ?? "Look at the lesson clue and try once more.");
  }

  return (
    <section className="choice-checkpoint" aria-labelledby={`${groupId}-title`}>
      <div className="choice-checkpoint-heading">
        <div>
          <p className="eyebrow">Quick checkpoint</p>
          <h3 id={`${groupId}-title`}>{title}</h3>
        </div>
        <span className={completed ? "is-passed" : undefined}>
          <i aria-hidden="true">{completed ? "✓" : "?"}</i>
          {completed ? "Cleared" : "Your turn"}
        </span>
      </div>

      <form onSubmit={checkAnswer}>
        <fieldset disabled={completed}>
          <legend>{question}</legend>
          <div className="choice-options">
            {options.map((option, index) => {
              const optionId = `${groupId}-${option.id}`;
              const selected = displayedSelection === option.id;

              return (
                <label
                  key={option.id}
                  className={selected ? "is-selected" : undefined}
                  htmlFor={optionId}
                >
                  <input
                    id={optionId}
                    type="radio"
                    name={`${groupId}-answer`}
                    value={option.id}
                    checked={selected}
                    onChange={(event) => {
                      setSelectedId(event.target.value);
                      setFeedback("");
                      setAnswerCorrect(false);
                    }}
                  />
                  <span aria-hidden="true">
                    {selected ? "✓" : String.fromCharCode(65 + index)}
                  </span>
                  <strong>{option.label}</strong>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className="choice-checkpoint-actions">
          <button
            className="button button-primary"
            type="submit"
            disabled={!selectedId || completed}
          >
            {completed ? "Checkpoint cleared" : "Check my answer"}
          </button>
          {attempts > 0 && !completed ? (
            <small>Attempt {attempts + 1} · keep going</small>
          ) : null}
        </div>
      </form>

      {displayedFeedback ? (
        <div
          className={`choice-feedback${completed || answerCorrect ? " is-correct" : " is-try-again"}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span aria-hidden="true">{completed || answerCorrect ? "✓" : "↳"}</span>
          <p>{displayedFeedback}</p>
        </div>
      ) : null}

      {showHint ? (
        <div className="practice-hint" role="note" aria-live="polite">
          <span aria-hidden="true">💡</span>
          <p><strong>Hint unlocked:</strong> {hint}</p>
        </div>
      ) : null}
    </section>
  );
}
