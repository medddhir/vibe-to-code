"use client";

import { useMemo, useState } from "react";

import { useLessonProgress } from "@/components/guided-lesson-flow";
import {
  runStateUpdate,
  type SimTraceStep,
} from "@/lib/foundations-simulators";
import { ExecutionTrace } from "@/components/foundations/execution-trace";

type StateLabProps = {
  stepId: string;
  title: string;
  instructions: string;
  starterInput: number;
  starterFormula: string;
  initialState: number;
  targetState: number;
  hint: string;
  successMessage: string;
};

function buildTraceFromState(run: { state: number; trace: SimTraceStep[] }) {
  return {
    label: "State journey trace",
    entries: run.trace,
  };
}

export function StateLab({
  stepId,
  title,
  instructions,
  starterInput,
  starterFormula,
  initialState,
  targetState,
  hint,
  successMessage,
}: StateLabProps) {
  const {
    attemptsByStep,
    saveCode,
    practiceCompletedIds,
    completePractice,
    recordFailedAttempt,
    recordHintUsage,
  } = useLessonProgress();

  const attempts = attemptsByStep[stepId] ?? 0;
  const completed = practiceCompletedIds.includes(stepId);
  const [inputValue, setInputValue] = useState(String(starterInput));
  const [formula, setFormula] = useState(starterFormula);
  const [stateValue, setStateValue] = useState(initialState);
  const [runTrace, setRunTrace] = useState<SimTraceStep[]>([]);
  const [feedback, setFeedback] = useState("Run one click to see event → state → screen.");
  const [output, setOutput] = useState(`Starting state: ${initialState}`);
  const showHint = attempts >= 3 && !completed;

  const isPassing = useMemo(
    () => (completed ? true : Number(stateValue) === targetState),
    [completed, stateValue, targetState],
  );

  function runUpdate() {
    saveCode(stepId, `${inputValue}|${formula}`);

    const result = runStateUpdate(stateValue, inputValue, formula);
    setRunTrace(result.trace);

    if (!result.ok) {
      setOutput(result.error || "Something was not right yet.");
      setFeedback(result.friendlyMessage || "Check the formula and input for a valid update.");
      if (!completed) {
        recordFailedAttempt(stepId);
        if (attempts === 2) {
          recordHintUsage(stepId);
        }
      }
      return;
    }

    setOutput(result.output);
    setStateValue(result.state);

    if (result.state === targetState) {
      setFeedback(successMessage);
      completePractice(stepId);
    } else {
      setFeedback(`One event ran. Predict again: target state is ${targetState}.`);
      if (!completed) {
        recordFailedAttempt(stepId);
        if (attempts === 2) {
          recordHintUsage(stepId);
        }
      }
    }
  }

  function resetLab() {
    setInputValue(String(starterInput));
    setFormula(starterFormula);
    setStateValue(initialState);
    setRunTrace([]);
    setOutput(`Starting state: ${initialState}`);
    setFeedback("Run one click to see event → state → screen.");
  }

  return (
    <section className="choice-checkpoint" aria-labelledby={`${stepId}-state-title`}>
      <div className="choice-checkpoint-heading">
        <div>
          <p className="eyebrow">State simulator</p>
          <h3 id={`${stepId}-state-title`}>{title}</h3>
        </div>
        <span className={completed ? "is-passed" : undefined}>
          <i aria-hidden="true">{completed ? "✓" : "◎"}</i>
          {completed ? "Completed" : "Your turn"}
        </span>
      </div>

      <p className="practice-console-instructions">{instructions}</p>

      <div className="state-lab" role="group" aria-label="State simulation controls">
        <label htmlFor={`${stepId}-state-input`}>Click payload</label>
        <input
          id={`${stepId}-state-input`}
          type="number"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          style={{ width: "130px" }}
        />

        <label htmlFor={`${stepId}-state-formula`}>Update rule</label>
        <input
          id={`${stepId}-state-formula`}
          value={formula}
          onChange={(event) => setFormula(event.target.value.slice(0, 80))}
          aria-label="State update formula"
        />

        <div className="state-lab-row">
          <div>
            <strong>Current state:</strong> <code>{stateValue}</code>
          </div>
          <div>
            <strong>Target:</strong> <code>{targetState}</code>
          </div>
          <div>
            <strong>Output:</strong> <code>{output}</code>
          </div>
        </div>

        <div className="choice-checkpoint-actions">
          <button className="button button-primary" type="button" onClick={runUpdate}>
            Simulate one click
          </button>
          <button className="button button-secondary" type="button" onClick={resetLab}>
            Reset lab
          </button>
        </div>
      </div>

      <div
        className={`practice-output is-${isPassing ? "success" : "warning"}`}
        role="status"
        aria-live="polite"
      >
        <div className="practice-output-label">
          <span>Action feedback</span>
          <small>{attempts > 0 && !completed ? `Attempt ${attempts + 1}` : null}</small>
        </div>
        <p>{feedback}</p>
      </div>

      {runTrace.length > 0 ? <ExecutionTrace label="Event → state trace" entries={buildTraceFromState({ state: stateValue, trace: runTrace }).entries} /> : null}

      {showHint ? (
        <div className="practice-hint" role="note" aria-live="polite">
          <span aria-hidden="true">💡</span>
          <p><strong>Hint unlocked:</strong> {hint}</p>
        </div>
      ) : null}
    </section>
  );
}
