"use client";

import { useState } from "react";

import { useLessonProgress } from "@/components/guided-lesson-flow";
import { simulateCodeJourney, type JourneySimulation } from "@/lib/foundations-simulators";

type JourneyMode = "normal" | "broken-runtime";
type JourneyLanguage = "python" | "javascript" | "compiled";

type JourneyLabProps = {
  stepId: string;
  title: string;
  instructions: string;
  expectedLanguage: JourneyLanguage;
  expectedMode?: JourneyMode;
  targetDecisionLabel?: string;
  hint: string;
  successMessage?: string;
};

function modeLabel(mode: JourneyMode) {
  return mode === "broken-runtime" ? "Broken runtime" : "Normal route";
}

export function CodeJourneyLab({
  stepId,
  title,
  instructions,
  expectedLanguage,
  expectedMode = "normal",
  targetDecisionLabel,
  hint,
  successMessage = "Great. Your route choice is correct for this lesson challenge.",
}: JourneyLabProps) {
  const {
    attemptsByStep,
    practiceCompletedIds,
    completePractice,
    recordFailedAttempt,
    recordHintUsage,
    saveCode,
  } = useLessonProgress();

  const attempts = attemptsByStep[stepId] ?? 0;
  const completed = practiceCompletedIds.includes(stepId);
  const [language, setLanguage] = useState<JourneyLanguage>("python");
  const [mode, setMode] = useState<JourneyMode>("normal");
  const [traceStep, setTraceStep] = useState(1);
  const [simulation, setSimulation] = useState<JourneySimulation>(() =>
    simulateCodeJourney("python"),
  );
  const [outputMode, setOutputMode] = useState<"neutral" | "success" | "warning" | "error">(
    "neutral",
  );
  const [feedback, setFeedback] = useState("Choose language and mode, then run simulation.");
  const showHint = attempts >= 3 && !completed;
  const comparison = [
    simulateCodeJourney("python", mode),
    simulateCodeJourney("javascript", mode),
    simulateCodeJourney("compiled", mode),
  ];

  const runSimulation = () => {
    const next = simulateCodeJourney(language, mode);
    setSimulation(next);
    setTraceStep(1);
    saveCode(stepId, `${language}:${mode}`);

    const languageMatch = language === expectedLanguage;
    const modeMatch = mode === expectedMode;

    const targetLabelOk = targetDecisionLabel
      ? next.routeLabel === targetDecisionLabel
      : true;

    if (languageMatch && modeMatch && targetLabelOk) {
      setOutputMode("success");
      setFeedback(successMessage);
      if (!completed) {
        completePractice(stepId);
      }
      return;
    }

    setOutputMode("warning");
    setFeedback(`Great progress. Route: ${next.routeLabel} in ${modeLabel(mode)}. Update your selection to match the challenge.`);

    if (!completed) {
      recordFailedAttempt(stepId);
      if (attempts === 2) {
        recordHintUsage(stepId);
      }
    }
  };

  const nextTraceStep = () => {
    setTraceStep((current) => Math.min(current + 1, simulation.steps.length));
  };

  const previousTraceStep = () => {
    setTraceStep((current) => Math.max(current - 1, 1));
  };

  return (
    <section className="choice-checkpoint" aria-labelledby={`${stepId}-journey-title`}>
      <div className="choice-checkpoint-heading">
        <div>
          <p className="eyebrow">Code journey lab</p>
          <h3 id={`${stepId}-journey-title`}>{title}</h3>
        </div>
        <span className={completed ? "is-passed" : undefined}>
          <i aria-hidden="true">{completed ? "✓" : "◎"}</i>
          {completed ? "Completed" : "Your turn"}
        </span>
      </div>

      <p className="practice-console-instructions">{instructions}</p>

      <div className="choice-checkpoint-actions">
        <label>
          <span>Language</span>
          <select
            value={language}
            onChange={(event) => setLanguage(event.target.value as JourneyLanguage)}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="compiled">Compiled app</option>
          </select>
        </label>

        <label>
          <span>Route mode</span>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as JourneyMode)}
          >
            <option value="normal">Normal</option>
            <option value="broken-runtime">Broken runtime</option>
          </select>
        </label>

        <button className="button button-primary" type="button" onClick={runSimulation}>
          Run simulator
        </button>
      </div>

      <div className="journey-trace" aria-live="polite">
        <div className="journey-trace-header">
          <strong>{simulation.routeLabel}</strong>
          <small>{simulation.routeTagline}</small>
        </div>

        <ol className="journey-steps">
          {simulation.steps.slice(0, traceStep).map((step, index) => (
            <li key={`${step.phase}-${index}`}>
              <span>{index + 1}</span>
              <div>
                <p>{step.phase}</p>
                <small>{step.detail}</small>
              </div>
            </li>
          ))}
        </ol>

        <div className="choice-checkpoint-actions">
          <button className="button button-secondary" type="button" onClick={previousTraceStep}>
            ← Back step
          </button>
          <button className="button button-secondary" type="button" onClick={nextTraceStep}>
            Next step ({traceStep}/{simulation.steps.length})
          </button>
        </div>
        <div className={`practice-output is-${outputMode}`}>
          <div className="practice-output-label"><span>Result</span></div>
          <p>{feedback}</p>
          <pre>{simulation.result}</pre>
        </div>
      </div>

      <div style={{ marginTop: 12 }} className="code-comparison" role="region" aria-label="Route comparison">
        {comparison.map((entry) => (
          <article key={`${entry.language}-comparison`} className="comparison-card">
            <div>
              <strong>{entry.routeLabel}</strong>
              <small>{entry.routeTagline}</small>
            </div>
            <p>{entry.result}</p>
          </article>
        ))}
      </div>

      {showHint ? (
        <div className="practice-hint" role="note" aria-live="polite">
          <span aria-hidden="true">💡</span>
          <p>
            <strong>Hint unlocked:</strong> {hint}
          </p>
        </div>
      ) : null}
    </section>
  );
}
