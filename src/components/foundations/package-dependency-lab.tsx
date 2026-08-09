"use client";

import { useMemo, useState } from "react";

import { useLessonProgress } from "@/components/guided-lesson-flow";
import { compareEnvironmentDependencies, simulatePackageCommand, type PackageLockSimulation } from "@/lib/foundations-simulators";
import { ExecutionTrace } from "@/components/foundations/execution-trace";

type PackageLockEnvironment = Record<string, string>;

type PackageDependencyLabMode = "install" | "reject-unknown";

type PackageDependencyLabProps = {
  stepId: string;
  title: string;
  instructions: string;
  starterManifest: PackageLockEnvironment;
  starterLock: string;
  starterCommand?: string;
  mode: PackageDependencyLabMode;
  expectedPackageName?: string;
  expectedPackageVersion?: string;
  expectedFailureMessage?: string;
  localEnvironment: PackageLockEnvironment;
  productionEnvironment: PackageLockEnvironment;
  hint: string;
  successMessage?: string;
};

function formatManifest(manifest: PackageLockEnvironment) {
  return JSON.stringify(manifest, null, 2);
}

function localStorageHint(manifest: PackageLockEnvironment, local: PackageLockEnvironment) {
  const matches = Object.entries(manifest).filter(
    ([name, version]) => local[name] === version,
  ).length;
  const total = Object.keys(manifest).length;
  return total > 0 ? `${matches}/${total} manifest versions match local environment` : "No packages detected.";
}

export function PackageDependencyLab({
  stepId,
  title,
  instructions,
  starterManifest,
  starterLock,
  starterCommand = "npm install react@18.2.0",
  mode,
  expectedPackageName,
  expectedPackageVersion,
  expectedFailureMessage,
  localEnvironment,
  productionEnvironment,
  hint,
  successMessage = "Dependency state is now consistent and lock metadata updated.",
}: PackageDependencyLabProps) {
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
  const initialSaved = savedCodeByStep[stepId];
  const saved = useMemo(() => {
    if (!initialSaved) {
      return null;
    }
    try {
      const parsed = JSON.parse(initialSaved) as { command: string; manifest: PackageLockEnvironment };
      return parsed;
    } catch {
      return null;
    }
  }, [initialSaved]);

  const [manifest, setManifest] = useState<PackageLockEnvironment>(() =>
    saved?.manifest ?? starterManifest,
  );
  const [command, setCommand] = useState(() => saved?.command ?? starterCommand);
  const [lockFile, setLockFile] = useState(starterLock);
  const [phases, setPhases] = useState<Array<{ phase: string; detail: string; storage?: Record<string, unknown>; output?: string }>>([]);
  const [outcome, setOutcome] = useState<PackageLockSimulation | null>(null);
  const [feedback, setFeedback] = useState("Run a terminal command to update the simulator.");
  const [outputMode, setOutputMode] = useState<"neutral" | "success" | "error" | "warning">("neutral");

  const envMatch = compareEnvironmentDependencies(manifest, localEnvironment);
  const prodMatch = compareEnvironmentDependencies(manifest, productionEnvironment);
  const compatibilityText = useMemo(
    () =>
      `Local vs lock: ${envMatch.matches ? "match" : "mismatch"} | Prod vs lock: ${
        prodMatch.matches ? "match" : "mismatch"
      }`,
    [envMatch.matches, prodMatch.matches],
  );

  function evaluateCompletion(simulated: PackageLockSimulation) {
    if (mode === "reject-unknown") {
      if (!expectedFailureMessage) {
        return !simulated.ok;
      }
      return !simulated.ok && (simulated.message ?? "").includes(expectedFailureMessage);
    }

    if (!expectedPackageName || !expectedPackageVersion) {
      return simulated.ok;
    }

    const version = simulated.manifest?.[expectedPackageName];
    return simulated.ok && version === `^${expectedPackageVersion}`;
  }

  function runCommand() {
    saveCode(stepId, JSON.stringify({ command, manifest }));
    const next = simulatePackageCommand(manifest, command);
    setOutcome(next);
    setLockFile(next.lock);
    setManifest(next.manifest);
    setPhases(next.trace);
    setFeedback(next.friendlyMessage);

    if (next.ok) {
      setOutputMode("success");
      if (evaluateCompletion(next)) {
        setFeedback(successMessage);
        setOutputMode("success");
        completePractice(stepId);
      } else {
        setOutputMode("warning");
        if (next.output) {
          setFeedback(next.output);
        }
      }
    } else {
      setOutputMode("error");
      if (!completed) {
        recordFailedAttempt(stepId);
        if (attempts === 2) {
          recordHintUsage(stepId);
        }
      }
    }
  }

  function resetLab() {
    setManifest(starterManifest);
    setLockFile(starterLock);
    setCommand(starterCommand);
    setOutcome(null);
    setPhases([]);
    setFeedback("Run a terminal command to update the simulator.");
    setOutputMode("neutral");
    saveCode(stepId, JSON.stringify({ command: starterCommand, manifest: starterManifest }));
  }

  return (
    <section className="choice-checkpoint" aria-labelledby={`${stepId}-package-title`}>
      <div className="choice-checkpoint-heading">
        <div>
          <p className="eyebrow">Dependency lab</p>
          <h3 id={`${stepId}-package-title`}>{title}</h3>
        </div>
        <span className={completed ? "is-passed" : undefined}>
          <i aria-hidden="true">{completed ? "✓" : "◎"}</i>
          {completed ? "Completed" : "Your turn"}
        </span>
      </div>

      <p className="practice-console-instructions">{instructions}</p>

      <div className="package-lab-grid">
        <article className="package-file-card">
          <h4>project tree</h4>
          <ul>
            <li>
              <strong>package.json</strong>
              <small>editable via terminal commands</small>
            </li>
            <li>
              <strong>package-lock.json</strong>
              <small>auto-generated by simulator</small>
            </li>
            <li>
              <strong>README.md</strong>
              <small>explains allowed command grammar</small>
            </li>
          </ul>
          <label htmlFor={`${stepId}-package-json`}>package.json snapshot</label>
          <pre className="package-preview">{formatManifest(manifest)}</pre>
        </article>

        <article className="package-file-card">
          <h4>simulated lockfile</h4>
          <pre className="package-preview" aria-live="polite">
            {lockFile}
          </pre>
        </article>
      </div>

      <div className="package-terminal-wrap">
        <label htmlFor={`${stepId}-package-command`}>Strict command</label>
        <input
          id={`${stepId}-package-command`}
          type="text"
          value={command}
          onChange={(event) => setCommand(event.target.value.slice(0, 120))}
          placeholder="npm install react@18.2.0"
        />
        <div className="choice-checkpoint-actions">
          <button className="button button-primary" type="button" onClick={runCommand}>
            Run simulator command
          </button>
          <button className="button button-secondary" type="button" onClick={resetLab}>
            Reset lab
          </button>
        </div>
      </div>

      <div className="dependency-environments">
        <article>
          <strong>Version behavior</strong>
          <p>{compatibilityText}</p>
          <small>Local: {localStorageHint(manifest, localEnvironment)}</small>
        </article>
        {!prodMatch.matches ? (
          <article>
            <strong>Environment diff</strong>
            <p>Production lock differs from current local setup. Identify what needs to be aligned.</p>
          </article>
        ) : (
          <article>
            <strong>Environment diff</strong>
            <p>Production and local environments are aligned for this manifest.</p>
          </article>
        )}
      </div>

      <div
        className={`practice-output is-${outputMode}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="practice-output-label">
          <span>Dependency simulator</span>
          <small>{attempts > 0 && !completed ? `Attempt ${attempts + 1}` : null}</small>
        </div>
        <p>{outcome ? outcome.output : feedback}</p>
        {outcome ? <p>{outcome.friendlyMessage}</p> : null}
        {phases.length > 0 ? (
          <ExecutionTrace
            label="Terminal steps"
            entries={phases.map((entry) => ({
              phase: entry.phase,
              detail: entry.detail,
              memory: entry.storage,
              output: entry.output,
            }))}
          />
        ) : null}
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
