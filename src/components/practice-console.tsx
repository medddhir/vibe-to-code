"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

import { useLessonProgress } from "@/components/guided-lesson-flow";
import { runBeginnerPython } from "@/lib/beginner-python";

type PracticeConsoleProps = {
  stepId: string;
  title: string;
  instructions: string;
  starterCode: string;
  expectedOutput: string;
  hint: string;
};

type ConsoleResult =
  | { kind: "success"; output: string; message: string }
  | { kind: "wrong-output"; output: string; message: string }
  | { kind: "error"; output: string; message: string }
  | null;

function normalizeOutput(value: string) {
  return value.replace(/\r\n?/g, "\n").trimEnd();
}

export function PracticeConsole({
  stepId,
  title,
  instructions,
  starterCode,
  expectedOutput,
  hint,
}: PracticeConsoleProps) {
  const {
    attemptsByStep,
    savedCodeByStep,
    practiceCompletedIds,
    completePractice,
    recordFailedAttempt,
    saveCode,
  } = useLessonProgress();
  const [code, setCode] = useState(() => savedCodeByStep[stepId] ?? starterCode);
  const attempts = attemptsByStep[stepId] ?? 0;
  const completed = practiceCompletedIds.includes(stepId);
  const [result, setResult] = useState<ConsoleResult>(null);
  const descriptionId = `${stepId}-practice-description`;
  const outputId = `${stepId}-practice-output`;
  const hintVisible = attempts >= 3 && !completed;
  const statusLabel = useMemo(() => {
    if (completed) {
      return "Passed";
    }
    if (result?.kind === "error" || result?.kind === "wrong-output") {
      return "Try again";
    }
    return "Ready";
  }, [completed, result]);

  function runCode() {
    saveCode(stepId, code);
    const runResult = runBeginnerPython(code);

    if (!runResult.ok) {
      recordFailedAttempt(stepId);
      setResult({
        kind: "error",
        output: runResult.error,
        message: runResult.friendlyMessage,
      });
      return;
    }

    if (normalizeOutput(runResult.output) !== normalizeOutput(expectedOutput)) {
      recordFailedAttempt(stepId);
      setResult({
        kind: "wrong-output",
        output: runResult.output || "(no visible output)",
        message: `Your code ran, but the goal is to display exactly: ${expectedOutput}`,
      });
      return;
    }

    completePractice(stepId);
    setResult({
      kind: "success",
      output: runResult.output,
      message: "That is the exact result. You can move to the next topic now.",
    });
  }

  function handleEditorKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      runCode();
    }
  }

  function resetCode() {
    setCode(starterCode);
    saveCode(stepId, starterCode);
    setResult(null);
  }

  return (
    <section className="practice-console" aria-labelledby={`${stepId}-practice-title`}>
      <div className="practice-console-heading">
        <div>
          <p className="eyebrow">Try it here</p>
          <h3 id={`${stepId}-practice-title`}>{title}</h3>
        </div>
        <span className={completed ? "is-passed" : undefined}>
          <i aria-hidden="true">{completed ? "✓" : "●"}</i>
          {statusLabel}
        </span>
      </div>

      <p id={descriptionId} className="practice-console-instructions">{instructions}</p>

      <div className="practice-console-window">
        <div className="practice-console-bar" aria-hidden="true">
          <span />
          <span />
          <span />
          <small>lesson.py · safe practice runner</small>
        </div>

        <div className="practice-editor-wrap">
          <label htmlFor={`${stepId}-editor`}>Python code</label>
          <div className="practice-editor">
            <span aria-hidden="true">1</span>
            <textarea
              id={`${stepId}-editor`}
              value={code}
              rows={Math.max(3, code.split("\n").length)}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              aria-describedby={descriptionId}
              onChange={(event) => setCode(event.target.value.slice(0, 10_000))}
              onBlur={() => saveCode(stepId, code)}
              onKeyDown={handleEditorKeyDown}
            />
          </div>
        </div>

        <div className="practice-console-actions">
          <button className="practice-run-button" type="button" onClick={runCode}>
            <span aria-hidden="true">▶</span>
            Run code
          </button>
          <button className="practice-reset-button" type="button" onClick={resetCode}>
            Reset code
          </button>
          <small>Shortcut: Ctrl/⌘ + Enter</small>
        </div>

        <div
          id={outputId}
          className={`practice-output${result ? ` is-${result.kind}` : ""}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="practice-output-label">
            <span>Output</span>
            {attempts > 0 && !completed ? <small>{attempts} failed {attempts === 1 ? "try" : "tries"}</small> : null}
          </div>
          {result ? (
            <>
              <p>{result.message}</p>
              <pre>{result.output}</pre>
            </>
          ) : completed ? (
            <p className="practice-completed-note">✓ Completed earlier. You can run the code again anytime.</p>
          ) : (
            <p className="practice-empty-output">Your result or error will appear here.</p>
          )}
        </div>
      </div>

      <div className="practice-safety-note">
        <span aria-hidden="true">◎</span>
        <p><strong>Made for learning.</strong> This fast runner understands the beginner Python used here and cannot access your files or the internet. Practice code saves on this device, so never paste passwords or API keys.</p>
      </div>

      {hintVisible ? (
        <div className="practice-hint" role="note">
          <span aria-hidden="true">💡</span>
          <p><strong>Hint unlocked after three tries:</strong> {hint}</p>
        </div>
      ) : null}
    </section>
  );
}
