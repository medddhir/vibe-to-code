"use client";

import { useState } from "react";

import { FileTabs } from "@/components/foundations/file-tabs";
import { useLessonProgress } from "@/components/guided-lesson-flow";
import {
  buildLanguagePreview,
  type FileLanguage,
  type SyntaxSimulationResult,
  validateLanguagePack,
} from "@/lib/foundations-simulators";

type LanguageFiles = Record<FileLanguage, string>;

type LanguageSyntaxRequirement = (files: LanguageFiles, results: SyntaxSimulationResult[]) => string | null;

type LanguageSyntaxLabProps = {
  stepId: string;
  title: string;
  instructions: string;
  starterFiles: LanguageFiles;
  hint: string;
  successMessage?: string;
  required?: LanguageSyntaxRequirement;
};

const FILE_ORDER: FileLanguage[] = ["html", "css", "javascript"];

function safeLabel(file: FileLanguage) {
  return file === "html" ? "HTML" : file === "css" ? "CSS" : "JavaScript";
}

function buildPreviewFiles(files: LanguageFiles) {
  const preview = buildLanguagePreview({
    html: files.html,
    css: files.css,
    javascript: files.javascript,
  });

  return preview;
}

function formatResults(results: SyntaxSimulationResult[]) {
  const passed = results.filter((entry) => entry.passed).length;
  return {
    passed,
    total: results.length,
    issues: results.flatMap((entry) =>
      entry.issues.map((issue) => `${safeLabel(entry.file)}: ${issue.message}`),
    ),
  };
}

export function LanguageSyntaxLab({
  stepId,
  title,
  instructions,
  starterFiles,
  hint,
  successMessage = "Great. Your language files now pass the syntax checks and the preview is active.",
  required,
}: LanguageSyntaxLabProps) {
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
  const [files, setFiles] = useState<LanguageFiles>(() => {
    const savedStep = savedCodeByStep[stepId];

    if (!savedStep) {
      return starterFiles;
    }

    try {
      const parsed = JSON.parse(savedStep) as Partial<Record<FileLanguage, string>>;
      if (
        typeof parsed.html === "string" &&
        typeof parsed.css === "string" &&
        typeof parsed.javascript === "string"
      ) {
        return {
          html: parsed.html,
          css: parsed.css,
          javascript: parsed.javascript,
        };
      }
    } catch {
      return starterFiles;
    }

    return starterFiles;
  });

  const [results, setResults] = useState<SyntaxSimulationResult[]>([]);
  const [feedback, setFeedback] = useState("Run the validator to unlock the next checkpoint.");
  const [outputMode, setOutputMode] = useState<"neutral" | "success" | "error">("neutral");
  const [lastOutput, setLastOutput] = useState("");
  const hintVisible = attempts >= 3 && !completed;

  const { passed, total, issues } = formatResults(results);
  const isAllGreen = total > 0 && passed === total;

  const tabs = FILE_ORDER.map((file) => ({
    id: file,
    label: safeLabel(file),
    language: file,
    content: files[file],
  }));

  const preview = buildPreviewFiles(files);

  function onChangeFile(fileId: string, content: string) {
    if (fileId !== "html" && fileId !== "css" && fileId !== "javascript") {
      return;
    }

    const file = fileId;

    setFiles((current) => {
      const next = { ...current, [file]: content };
      saveCode(stepId, JSON.stringify(next));
      return next;
    });
  }

  function runCheck() {
    const next = validateLanguagePack(files);
    setResults(next);

    const { passed, issues } = formatResults(next);
    const passMessage = required ? required(files, next) : null;

    if (passed === next.length && !passMessage) {
      setOutputMode("success");
      setFeedback(successMessage);
      setLastOutput(`All files are valid. ${next.length} file(s) checked.`);
      if (!completed) {
        completePractice(stepId);
      }

      return;
    }

    setOutputMode("error");
    setFeedback(passMessage ?? `The parser found ${issues.length} issue(s). Fix one issue and run again.`);
    setLastOutput(passMessage || issues.join("\n") || "Keep the syntax safe and minimal.");

    if (!completed) {
      recordFailedAttempt(stepId);
      if (attempts === 2) {
        recordHintUsage(stepId);
      }
    }
  }

  function resetLab() {
    setFiles(starterFiles);
    setResults([]);
    setFeedback("Run the validator to unlock the next checkpoint.");
    setOutputMode("neutral");
    setLastOutput("");
    saveCode(stepId, JSON.stringify(starterFiles));
  }

  return (
    <section className="choice-checkpoint" aria-labelledby={`${stepId}-syntax-title`}>
      <div className="choice-checkpoint-heading">
        <div>
          <p className="eyebrow">Language syntax simulator</p>
          <h3 id={`${stepId}-syntax-title`}>{title}</h3>
        </div>
        <span className={completed ? "is-passed" : undefined}>
          <i aria-hidden="true">{completed ? "✓" : "◎"}</i>
          {completed ? "Completed" : "Your turn"}
        </span>
      </div>

      <p className="practice-console-instructions">{instructions}</p>

      <FileTabs
        files={tabs}
        onFileChange={onChangeFile}
        renderPreview={() => (
          <iframe
            title="Live lesson preview"
            aria-label="Simulator iframe preview"
            sandbox="allow-scripts"
            srcDoc={preview}
          />
        )}
      />

      <div className="choice-checkpoint-actions" style={{ marginTop: 14 }}>
        <button className="button button-primary" type="button" onClick={runCheck}>
          Validate language files
        </button>
        <button className="button button-secondary" type="button" onClick={resetLab}>
          Reset workshop
        </button>
      </div>

      <div
        className={`practice-output is-${outputMode}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="practice-output-label">
          <span>Validator feedback</span>
          <small>{attempts > 0 && !completed ? `Attempt ${attempts + 1}` : null}</small>
        </div>
        <p>{feedback}</p>
        <pre>{lastOutput || (isAllGreen ? "All files are valid." : (issues.join("\n") || "No run yet."))}</pre>
      </div>

      {hintVisible ? (
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
