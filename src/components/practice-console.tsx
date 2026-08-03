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
  successMessage?: string;
  requireInitialRun?: boolean;
  validationMode?: "exact" | "personal-greeting";
  initialRunLabel?: string;
  initialRunInstructions?: string;
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
  successMessage = "That result matches the goal. The next checkpoint is unlocked.",
  requireInitialRun = false,
  validationMode = "exact",
  initialRunLabel = "Run broken code",
  initialRunInstructions = "Run the broken code once. The editor unlocks after the error appears.",
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
  const [editingUnlocked, setEditingUnlocked] = useState(
    () => !requireInitialRun || completed,
  );
  const descriptionId = `${stepId}-practice-description`;
  const outputId = `${stepId}-practice-output`;
  const hintVisible = attempts >= 3 && !completed;
  const statusLabel = useMemo(() => {
    if (completed) {
      return "Passed";
    }
    if (result?.kind === "error" || result?.kind === "wrong-output") {
      return "Keep going";
    }
    return "Ready";
  }, [completed, result]);

  function runCode() {
    saveCode(stepId, code);
    const runResult = runBeginnerPython(code);

    if (requireInitialRun && !editingUnlocked) {
      setEditingUnlocked(true);
    }

    if (!runResult.ok) {
      recordFailedAttempt(stepId);
      setResult({
        kind: "error",
        output: runResult.error,
        message: runResult.friendlyMessage,
      });
      return;
    }

    const normalizedOutput = normalizeOutput(runResult.output);
    const outputMatches =
      validationMode === "personal-greeting"
        ? /^Hello,\s+\S.*$/.test(normalizedOutput) &&
          normalizedOutput !== "Hello, Mira" &&
          normalizedOutput !== "Hello, name"
        : normalizedOutput === normalizeOutput(expectedOutput);

    if (!outputMatches) {
      recordFailedAttempt(stepId);
      setResult({
        kind: "wrong-output",
        output: runResult.output || "(no visible output)",
        message:
          validationMode === "personal-greeting"
            ? "Your code ran. Make it display Hello, followed by a name you choose—not Mira and not the word name."
            : `Your code ran, but the goal is to display exactly: ${expectedOutput}`,
      });
      return;
    }

    completePractice(stepId);
    setResult({
      kind: "success",
      output: runResult.output,
      message: successMessage,
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
    if (requireInitialRun && !completed) {
      setEditingUnlocked(false);
    }
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

      {requireInitialRun && !editingUnlocked ? (
        <div className="practice-first-run-note">
          <span aria-hidden="true">1</span>
          <p>{initialRunInstructions}</p>
        </div>
      ) : null}

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
            <textarea
              id={`${stepId}-editor`}
              value={code}
              rows={Math.min(8, Math.max(3, code.split("\n").length))}
              spellCheck={false}
              autoCapitalize="off"
              autoCorrect="off"
              readOnly={requireInitialRun && !editingUnlocked}
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
            {requireInitialRun && !editingUnlocked ? initialRunLabel : "Run code"}
          </button>
          <button
            className="practice-reset-button"
            type="button"
            disabled={requireInitialRun && !editingUnlocked}
            onClick={resetCode}
          >
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
            {attempts > 0 && !completed ? <small>Attempt {attempts + 1} · keep going</small> : null}
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
        <p><strong>Local learning runner.</strong> No file or internet access. Never paste passwords or API keys.</p>
      </div>

      {hintVisible ? (
        <div className="practice-hint" role="note" aria-live="polite">
          <span aria-hidden="true">💡</span>
          <p><strong>Hint unlocked after three tries:</strong> {hint}</p>
        </div>
      ) : null}
    </section>
  );
}
