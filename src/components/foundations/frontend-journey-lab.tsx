"use client";

import { useState } from "react";

import { useLessonProgress } from "@/components/guided-lesson-flow";
import { runFrontendJourney, type AppJourneyOutcome } from "@/lib/foundations-simulators";
import { ExecutionTrace } from "@/components/foundations/execution-trace";
import { RequestResponseInspector } from "@/components/foundations/request-response-inspector";

type FrontendJourneyGoal = {
  status?: number;
  requireOk?: boolean;
  minUserIdLength?: number;
  exactUserId?: string;
  requiredAmount?: number;
  requireAmountValue?: number;
  expectedBalance?: number;
  disallowSecretFields?: boolean;
  requireAmountNumber?: boolean;
};

type FrontendJourneyLabProps = {
  stepId: string;
  title: string;
  instructions: string;
  starterPayload: string;
  expectedGoal?: FrontendJourneyGoal;
  hint: string;
  successMessage?: string;
};

export function FrontendJourneyLab({
  stepId,
  title,
  instructions,
  starterPayload,
  expectedGoal,
  hint,
  successMessage = "Great. You observed one full frontend->backend->database update and state result.",
}: FrontendJourneyLabProps) {
  const {
    attemptsByStep,
    savedCodeByStep,
    practiceCompletedIds,
    completePractice,
    recordFailedAttempt,
    recordHintUsage,
    saveCode,
  } = useLessonProgress();

  const attempts = attemptsByStep[stepId] ?? 0;
  const completed = practiceCompletedIds.includes(stepId);
  const showHint = attempts >= 3 && !completed;
  const [payloadText, setPayloadText] = useState(() => savedCodeByStep[stepId] ?? starterPayload);
  const [result, setResult] = useState<AppJourneyOutcome | null>(null);
  const [feedback, setFeedback] = useState("Prepare a request payload and send one simulated click.");
  const [outputMode, setOutputMode] = useState<"neutral" | "success" | "warning" | "error">("neutral");

  const hasSecret = /"api[_-]?key"\s*:/i.test(payloadText) || /"secret"\s*:/i.test(payloadText);

  function isGoalMet(payload: Record<string, unknown>, result: AppJourneyOutcome) {
    const goal = expectedGoal;

    const status = goal?.status ?? 200;
    const requireOk = goal?.requireOk ?? true;

    if (requireOk && !result.ok) {
      return false;
    }

    if (result.status !== status) {
      return false;
    }

    if (goal?.minUserIdLength !== undefined) {
      if (typeof payload.userId !== "string" || payload.userId.length < goal.minUserIdLength) {
        return false;
      }
    }

    if (goal?.exactUserId !== undefined && payload.userId !== goal.exactUserId) {
      return false;
    }

    if (goal?.requireAmountNumber) {
      if (typeof payload.amount !== "number" || !Number.isFinite(payload.amount)) {
        return false;
      }
    }

    if (goal?.requiredAmount !== undefined && payload.amount !== goal.requiredAmount) {
      return false;
    }

    if (goal?.requireAmountValue !== undefined && payload.amount !== goal.requireAmountValue) {
      return false;
    }

    if (goal?.disallowSecretFields) {
      if (
        Object.prototype.hasOwnProperty.call(payload, "api_key") ||
        Object.prototype.hasOwnProperty.call(payload, "secret")
      ) {
        return false;
      }
    }

    if (goal?.expectedBalance !== undefined) {
      return result.response?.balance === goal.expectedBalance;
    }

    return true;
  }

  function runJourney() {
    saveCode(stepId, payloadText);
    const next = runFrontendJourney(payloadText);
    setResult(next);

    if (!next.ok) {
      setOutputMode("error");
      setFeedback(next.finalMessage);
      if (!completed) {
        recordFailedAttempt(stepId);
        if (attempts === 2) {
          recordHintUsage(stepId);
        }
      }
      return;
    }

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(payloadText) as Record<string, unknown>;
    } catch {
      payload = {};
    }

    if (hasSecret) {
      setOutputMode("warning");
      setFeedback(
        "Payload contains secret-like text. Move secrets out of the payload and keep them in server config.",
      );
      if (!completed) {
        recordFailedAttempt(stepId);
        if (attempts === 2) {
          recordHintUsage(stepId);
        }
      }
      return;
    }

    if (isGoalMet(payload, next)) {
      setOutputMode("success");
      setFeedback(successMessage);
      completePractice(stepId);
      return;
    }

    setOutputMode("warning");
    setFeedback(`Request reached the simulated journey but not yet in target state. ${next.finalMessage}`);
    if (!completed) {
      recordFailedAttempt(stepId);
      if (attempts === 2) {
        recordHintUsage(stepId);
      }
    }
  }

  function resetJourney() {
    setPayloadText(starterPayload);
    setResult(null);
    setFeedback("Prepare a request payload and send one simulated click.");
    setOutputMode("neutral");
    saveCode(stepId, starterPayload);
  }

  return (
    <section className="choice-checkpoint" aria-labelledby={`${stepId}-frontend-title`}>
      <div className="choice-checkpoint-heading">
        <div>
          <p className="eyebrow">Request journey</p>
          <h3 id={`${stepId}-frontend-title`}>{title}</h3>
        </div>
        <span className={completed ? "is-passed" : undefined}>
          <i aria-hidden="true">{completed ? "✓" : "◎"}</i>
          {completed ? "Completed" : "Your turn"}
        </span>
      </div>

      <p className="practice-console-instructions">{instructions}</p>

      <div className="choice-checkpoint-actions">
        <label htmlFor={`${stepId}-payload`} style={{ width: "100%" }}>
          Simulated payload
          <textarea
            id={`${stepId}-payload`}
            value={payloadText}
            rows={5}
            onChange={(event) => setPayloadText(event.target.value.slice(0, 800))}
            aria-label="Simulated frontend payload"
            style={{ width: "100%" }}
          />
        </label>
        <button className="button button-primary" type="button" onClick={runJourney}>
          Send simulated click
        </button>
        <button className="button button-secondary" type="button" onClick={resetJourney}>
          Reset journey
        </button>
      </div>

      <RequestResponseInspector
        requestLabel={result ? result.requestLabel : "POST /simulate"}
        method="POST"
        endpoint="/simulate"
        status={result?.status}
        response={result?.response}
      />

      <div
        className={`practice-output is-${outputMode}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="practice-output-label">
          <span>Journey feedback</span>
          {attempts > 0 && !completed ? <small>Attempt {attempts + 1}</small> : null}
        </div>
        <p>{feedback}</p>
        <pre>
          {result ? `Status: ${result.status}${result.error ? `\n${result.error}` : ""}` : "Ready to run."}
        </pre>
      </div>

      {result ? (
        <ExecutionTrace
          label="Frontend request trace"
          entries={result.phases.map((entry) => ({
            phase: entry.phase,
            detail: entry.detail,
            memory: entry.storage,
            output: entry.output,
          }))}
        />
      ) : null}

      {hasSecret ? (
        <div className="practice-hint">
          <span aria-hidden="true">⚠</span>
          <p>
            This payload includes a possible secret. Use the secure path and send only state-relevant fields from the frontend.
          </p>
        </div>
      ) : null}

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
