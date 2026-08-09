"use client";

import { useMemo, useState } from "react";

import { useLessonProgress } from "@/components/guided-lesson-flow";
import {
  checkSystemLayer,
  createWorkspaceItem,
  inspectWorkbenchDocument,
  resolveLearningPath,
  runSavedPrintSource,
  runTerminalCommand,
  SYSTEM_STACK_ITEMS,
  type SystemLayer,
  type TerminalState,
  type WorkspaceEntry,
} from "@/lib/computer-confidence-simulators";

type LabCopy = {
  stepId: string;
  title: string;
  instructions: string;
  hint: string;
  successMessage: string;
};

function useLabProgress(stepId: string) {
  const progress = useLessonProgress();
  const attempts = progress.attemptsByStep[stepId] ?? 0;
  const completed = progress.practiceCompletedIds.includes(stepId);

  function recordFailure() {
    if (completed) {
      return;
    }

    progress.recordFailedAttempt(stepId);
    if (attempts === 2) {
      progress.recordHintUsage(stepId);
    }
  }

  return {
    ...progress,
    attempts,
    completed,
    recordFailure,
    showHint: attempts >= 3 && !completed,
  };
}

function LabHeader({
  title,
  completed,
  eyebrow,
}: {
  title: string;
  completed: boolean;
  eyebrow: string;
}) {
  return (
    <div className="choice-checkpoint-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h3>{title}</h3>
      </div>
      <span className={completed ? "is-passed" : undefined}>
        <i aria-hidden="true">{completed ? "✓" : "◎"}</i>
        {completed ? "Completed" : "Your turn"}
      </span>
    </div>
  );
}

function LabFeedback({
  feedback,
  completed,
  attempts,
  hint,
  showHint,
}: {
  feedback: string;
  completed: boolean;
  attempts: number;
  hint: string;
  showHint: boolean;
}) {
  return (
    <>
      <div
        className={`practice-output is-${completed ? "success" : "warning"}`}
        role="status"
        aria-live="polite"
      >
        <div className="practice-output-label">
          <span>Learning feedback</span>
          <small>{attempts > 0 && !completed ? `Attempt ${attempts + 1}` : null}</small>
        </div>
        <p>{feedback}</p>
      </div>
      {showHint ? (
        <div className="practice-hint" role="note" aria-live="polite">
          <span aria-hidden="true">💡</span>
          <p><strong>Hint unlocked:</strong> {hint}</p>
        </div>
      ) : null}
    </>
  );
}

type SaveRunLabProps = LabCopy & {
  starterSaved: string;
  starterDraft?: string;
  expectedOutput: string;
};

export function SaveRunLab({
  stepId,
  title,
  instructions,
  hint,
  successMessage,
  starterSaved,
  starterDraft = starterSaved,
  expectedOutput,
}: SaveRunLabProps) {
  const {
    attempts,
    completed,
    completePractice,
    recordFailure,
    saveCode,
    showHint,
  } = useLabProgress(stepId);
  const [draft, setDraft] = useState(starterDraft);
  const [saved, setSaved] = useState(starterSaved);
  const [output, setOutput] = useState("Nothing has run yet.");
  const [feedback, setFeedback] = useState(
    "The runtime can only execute the last saved version of the file.",
  );
  const dirty = draft !== saved;

  function saveFile() {
    setSaved(draft);
    saveCode(stepId, draft);
    setFeedback("Saved. The runtime can now see this version.");
  }

  function runFile() {
    const result = runSavedPrintSource(saved);
    setOutput(result.ok ? result.output : result.error ?? "The file could not run.");

    if (result.ok && result.output === expectedOutput) {
      setFeedback(successMessage);
      completePractice(stepId);
      return;
    }

    setFeedback(
      dirty
        ? "Your editor has unsaved changes, so the older saved version ran. Save, then run again."
        : result.error ?? `The file ran, but the goal output is: ${expectedOutput}`,
    );
    recordFailure();
  }

  return (
    <section className="choice-checkpoint confidence-lab" aria-labelledby={`${stepId}-title`}>
      <LabHeader title={title} completed={completed} eyebrow="Edit → save → run" />
      <p className="practice-console-instructions">{instructions}</p>

      <div className="save-run-lab">
        <div className="save-run-editor-heading">
          <label id={`${stepId}-title`} htmlFor={`${stepId}-source`}>message.py</label>
          <span className={dirty ? "is-dirty" : "is-saved"}>
            {dirty ? "● Unsaved changes" : "✓ Saved"}
          </span>
        </div>
        <textarea
          id={`${stepId}-source`}
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, 500))}
          spellCheck={false}
        />
        <div className="confidence-lab-actions">
          <button className="button button-secondary" type="button" onClick={saveFile}>
            Save file
          </button>
          <button className="button button-primary" type="button" onClick={runFile}>
            Run saved file
          </button>
        </div>
        <div className="confidence-output" aria-live="polite">
          <span>Runtime output</span>
          <pre>{output}</pre>
        </div>
      </div>

      <LabFeedback
        feedback={feedback}
        completed={completed}
        attempts={attempts}
        hint={hint}
        showHint={showHint}
      />
    </section>
  );
}

const systemLayers: Array<{ id: SystemLayer; label: string }> = [
  { id: "hardware", label: "Hardware" },
  { id: "operating-system", label: "Operating system" },
  { id: "application", label: "Application" },
  { id: "website", label: "Website" },
];

export function SystemStackLab({
  stepId,
  title,
  instructions,
  hint,
  successMessage,
}: LabCopy) {
  const {
    attempts,
    completed,
    completePractice,
    recordFailure,
    showHint,
  } = useLabProgress(stepId);
  const [itemIndex, setItemIndex] = useState(0);
  const [feedback, setFeedback] = useState("Place the first item into the correct layer.");
  const item = SYSTEM_STACK_ITEMS[itemIndex] ?? SYSTEM_STACK_ITEMS.at(-1);

  function chooseLayer(layer: SystemLayer) {
    if (!item || completed) {
      return;
    }

    const result = checkSystemLayer(item.id, layer);
    setFeedback(result.message);

    if (!result.ok) {
      recordFailure();
      return;
    }

    if (itemIndex === SYSTEM_STACK_ITEMS.length - 1) {
      setFeedback(successMessage);
      completePractice(stepId);
      return;
    }

    setItemIndex((current) => current + 1);
  }

  return (
    <section className="choice-checkpoint confidence-lab" aria-labelledby={`${stepId}-stack-title`}>
      <LabHeader title={title} completed={completed} eyebrow="System stack sorter" />
      <p className="practice-console-instructions">{instructions}</p>

      <div className="system-stack-lab">
        <div className="system-stack-item" id={`${stepId}-stack-title`}>
          <span>Item {Math.min(itemIndex + 1, SYSTEM_STACK_ITEMS.length)} of {SYSTEM_STACK_ITEMS.length}</span>
          <strong>{completed ? "Stack complete" : item?.label}</strong>
        </div>
        <div className="system-layer-options" role="group" aria-label="Choose a system layer">
          {systemLayers.map((layer) => (
            <button
              key={layer.id}
              type="button"
              onClick={() => chooseLayer(layer.id)}
              disabled={completed}
            >
              <span aria-hidden="true">{layer.id === "hardware" ? "▣" : layer.id === "operating-system" ? "OS" : layer.id === "application" ? "APP" : "WEB"}</span>
              <strong>{layer.label}</strong>
            </button>
          ))}
        </div>
      </div>

      <LabFeedback
        feedback={feedback}
        completed={completed}
        attempts={attempts}
        hint={hint}
        showHint={showHint}
      />
    </section>
  );
}

type FileExplorerLabProps = LabCopy & {
  targetFolder: string;
  targetFile: string;
};

export function FileExplorerLab({
  stepId,
  title,
  instructions,
  hint,
  successMessage,
  targetFolder,
  targetFile,
}: FileExplorerLabProps) {
  const {
    attempts,
    completed,
    completePractice,
    recordFailure,
    showHint,
  } = useLabProgress(stepId);
  const root = "/workspace";
  const [currentFolder, setCurrentFolder] = useState(root);
  const [entries, setEntries] = useState<WorkspaceEntry[]>([]);
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState(`Create the ${targetFolder} folder first.`);
  const visibleEntries = entries.filter((entry) => entry.parent === currentFolder);

  function create(type: WorkspaceEntry["type"]) {
    const result = createWorkspaceItem(entries, currentFolder, type, name);
    setFeedback(result.message);

    if (!result.ok) {
      recordFailure();
      return;
    }

    setEntries(result.entries);
    setName("");

    if (
      type === "file" &&
      currentFolder === `${root}/${targetFolder}` &&
      name.trim() === targetFile
    ) {
      setFeedback(successMessage);
      completePractice(stepId);
    }
  }

  return (
    <section className="choice-checkpoint confidence-lab" aria-labelledby={`${stepId}-files-title`}>
      <LabHeader title={title} completed={completed} eyebrow="File explorer simulator" />
      <p className="practice-console-instructions">{instructions}</p>

      <div className="file-explorer-lab">
        <div className="file-explorer-toolbar">
          <button
            type="button"
            onClick={() => setCurrentFolder(root)}
            disabled={currentFolder === root}
            aria-label="Return to workspace root"
          >
            ← Up
          </button>
          <code>{currentFolder}</code>
        </div>

        <div className="file-explorer-grid">
          <div className="file-explorer-tree" aria-label="Current folder contents">
            {visibleEntries.length ? visibleEntries.map((entry) => (
              <button
                key={`${entry.parent}-${entry.name}`}
                type="button"
                disabled={entry.type === "file"}
                onClick={() => {
                  if (entry.type === "folder") {
                    setCurrentFolder(`${entry.parent}/${entry.name}`);
                    setFeedback(`Opened ${entry.name}. Now create ${targetFile}.`);
                  }
                }}
              >
                <span aria-hidden="true">{entry.type === "folder" ? "▸" : "•"}</span>
                {entry.name}
              </button>
            )) : <p>This folder is empty.</p>}
          </div>

          <div className="file-explorer-create">
            <label htmlFor={`${stepId}-file-name`}>New item name</label>
            <input
              id={`${stepId}-file-name`}
              value={name}
              onChange={(event) => setName(event.target.value.slice(0, 64))}
              placeholder={currentFolder === root ? targetFolder : targetFile}
            />
            <div className="confidence-lab-actions">
              <button type="button" className="button button-secondary" onClick={() => create("folder")}>
                New folder
              </button>
              <button type="button" className="button button-primary" onClick={() => create("file")}>
                New file
              </button>
            </div>
          </div>
        </div>
      </div>

      <LabFeedback
        feedback={feedback}
        completed={completed}
        attempts={attempts}
        hint={hint}
        showHint={showHint}
      />
    </section>
  );
}

type PathResolverLabProps = LabCopy & {
  currentFolder: string;
  starterPath: string;
  targetPath: string;
  knownPaths: string[];
};

export function PathResolverLab({
  stepId,
  title,
  instructions,
  hint,
  successMessage,
  currentFolder,
  starterPath,
  targetPath,
  knownPaths,
}: PathResolverLabProps) {
  const {
    attempts,
    completed,
    completePractice,
    recordFailure,
    showHint,
  } = useLabProgress(stepId);
  const [path, setPath] = useState(starterPath);
  const [resolvedPath, setResolvedPath] = useState("Not resolved yet");
  const [feedback, setFeedback] = useState("Resolve the path from the current folder.");

  function resolvePath() {
    const result = resolveLearningPath(currentFolder, path);
    setResolvedPath(result.resolvedPath || "No path");

    if (
      result.ok &&
      result.resolvedPath === targetPath &&
      knownPaths.includes(result.resolvedPath)
    ) {
      setFeedback(successMessage);
      completePractice(stepId);
      return;
    }

    setFeedback(
      result.ok
        ? `${result.resolvedPath} does not point to the requested file. Check the current folder and every path segment.`
        : result.message,
    );
    recordFailure();
  }

  return (
    <section className="choice-checkpoint confidence-lab" aria-labelledby={`${stepId}-path-title`}>
      <LabHeader title={title} completed={completed} eyebrow="Path finder" />
      <p className="practice-console-instructions">{instructions}</p>

      <div className="path-resolver-lab">
        <div>
          <span>Current folder</span>
          <code>{currentFolder}</code>
        </div>
        <label id={`${stepId}-path-title`} htmlFor={`${stepId}-path-input`}>Path to open</label>
        <input
          id={`${stepId}-path-input`}
          value={path}
          onChange={(event) => setPath(event.target.value.slice(0, 180))}
          spellCheck={false}
        />
        <button className="button button-primary" type="button" onClick={resolvePath}>
          Resolve path
        </button>
        <div className="path-resolved-output">
          <span>Computer reads</span>
          <code>{resolvedPath}</code>
        </div>
      </div>

      <LabFeedback
        feedback={feedback}
        completed={completed}
        attempts={attempts}
        hint={hint}
        showHint={showHint}
      />
    </section>
  );
}

type WorkbenchLabProps = LabCopy & {
  expectedHeading: string;
  starterSource: string;
};

export function WorkbenchLab({
  stepId,
  title,
  instructions,
  hint,
  successMessage,
  expectedHeading,
  starterSource,
}: WorkbenchLabProps) {
  const {
    attempts,
    completed,
    completePractice,
    recordFailure,
    saveCode,
    showHint,
  } = useLabProgress(stepId);
  const [folderOpen, setFolderOpen] = useState(false);
  const [activePanel, setActivePanel] = useState<"explorer" | "search" | "problems" | "terminal">("explorer");
  const [fileOpen, setFileOpen] = useState(false);
  const [draft, setDraft] = useState(starterSource);
  const [saved, setSaved] = useState(starterSource);
  const [feedback, setFeedback] = useState("Open the whole project folder to reveal its files.");
  const inspection = useMemo(
    () => inspectWorkbenchDocument(saved, expectedHeading),
    [expectedHeading, saved],
  );

  function saveDocument() {
    if (!folderOpen || !fileOpen) {
      setFeedback("Open the project folder and index.html before saving.");
      recordFailure();
      return;
    }

    setSaved(draft);
    saveCode(stepId, draft);
    const result = inspectWorkbenchDocument(draft, expectedHeading);

    if (result.ok) {
      setFeedback(successMessage);
      completePractice(stepId);
      return;
    }

    setFeedback(result.problems[0] ?? "Check the heading and try again.");
    recordFailure();
  }

  return (
    <section className="choice-checkpoint confidence-lab" aria-labelledby={`${stepId}-workbench-title`}>
      <LabHeader title={title} completed={completed} eyebrow="VS Code practice desk" />
      <p className="practice-console-instructions">{instructions}</p>

      <div className="workbench-lab">
        <div className="workbench-activity-bar" aria-label="Workbench panels">
          {(["explorer", "search", "problems", "terminal"] as const).map((panel) => (
            <button
              key={panel}
              type="button"
              className={activePanel === panel ? "is-active" : undefined}
              onClick={() => setActivePanel(panel)}
            >
              {panel}
            </button>
          ))}
        </div>

        <div className="workbench-sidebar">
          <strong>{activePanel}</strong>
          {activePanel === "explorer" ? (
            folderOpen ? (
              <button type="button" onClick={() => setFileOpen(true)}>▾ my-first-site<br />&nbsp;&nbsp;index.html</button>
            ) : (
              <button
                className="button button-secondary"
                type="button"
                onClick={() => {
                  setFolderOpen(true);
                  setFeedback("Project folder opened. Select index.html in Explorer.");
                }}
              >
                Open project folder
              </button>
            )
          ) : activePanel === "problems" ? (
            <p>{inspection.problems.length ? inspection.problems.join(" ") : "No saved problems."}</p>
          ) : activePanel === "terminal" ? (
            <code>/workspace/my-first-site $</code>
          ) : (
            <p>Search across every file in the opened project.</p>
          )}
        </div>

        <div className="workbench-editor">
          <div className="workbench-tab">
            <span id={`${stepId}-workbench-title`}>{fileOpen ? "index.html" : "No file open"}</span>
            {fileOpen && draft !== saved ? <i>●</i> : null}
          </div>
          {fileOpen ? (
            <>
              <textarea
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 2_000))}
                aria-label="index.html editor"
                spellCheck={false}
              />
              <button className="button button-primary" type="button" onClick={saveDocument}>
                Save index.html
              </button>
              <div className="workbench-preview">
                <span>Saved browser preview</span>
                <strong>{inspection.heading || "No heading yet"}</strong>
              </div>
            </>
          ) : (
            <p>Choose index.html from Explorer to begin editing.</p>
          )}
        </div>
      </div>

      <LabFeedback
        feedback={feedback}
        completed={completed}
        attempts={attempts}
        hint={hint}
        showHint={showHint}
      />
    </section>
  );
}

type TerminalNavigationLabProps = LabCopy & {
  goalFolder: string;
};

const requiredTerminalAchievements = ["pwd", "ls", "mkdir", "cd", "pwd-goal"];

export function TerminalNavigationLab({
  stepId,
  title,
  instructions,
  hint,
  successMessage,
  goalFolder,
}: TerminalNavigationLabProps) {
  const {
    attempts,
    completed,
    completePractice,
    recordFailure,
    saveCode,
    showHint,
  } = useLabProgress(stepId);
  const initialState: TerminalState = {
    cwd: "/home/learner",
    directories: ["/home", "/home/learner", "/home/learner/projects"],
  };
  const [terminalState, setTerminalState] = useState(initialState);
  const [command, setCommand] = useState("");
  const [transcript, setTranscript] = useState<Array<{ command: string; output: string }>>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("Start with pwd. The prompt itself is not part of the command.");

  function submitCommand() {
    const result = runTerminalCommand(terminalState, command);
    const nextTranscript = [...transcript, { command: command.trim(), output: result.output }].slice(-10);
    setTranscript(nextTranscript);
    setCommand("");
    saveCode(stepId, nextTranscript.map((line) => line.command).join("\n"));

    if (!result.ok) {
      setFeedback(result.output);
      recordFailure();
      return;
    }

    setTerminalState(result.state);
    const next = new Set(achievements);
    const normalizedCommand = result.command;

    if (normalizedCommand === "pwd") {
      next.add(result.state.cwd.endsWith(`/${goalFolder}`) ? "pwd-goal" : "pwd");
    } else if (normalizedCommand === "ls") {
      next.add("ls");
    } else if (normalizedCommand === `mkdir ${goalFolder}`) {
      next.add("mkdir");
    } else if (normalizedCommand === `cd ${goalFolder}`) {
      next.add("cd");
    }

    const nextAchievements = [...next];
    setAchievements(nextAchievements);

    if (requiredTerminalAchievements.every((item) => next.has(item))) {
      setFeedback(successMessage);
      completePractice(stepId);
      return;
    }

    setFeedback(
      result.output
        ? `Command worked. Output: ${result.output}`
        : "Command worked. No output is normal for this command.",
    );
  }

  return (
    <section className="choice-checkpoint confidence-lab" aria-labelledby={`${stepId}-terminal-title`}>
      <LabHeader title={title} completed={completed} eyebrow="Safe terminal simulator" />
      <p className="practice-console-instructions">{instructions}</p>

      <div className="terminal-navigation-lab">
        <div className="terminal-task-strip" aria-label="Terminal mission checklist">
          {requiredTerminalAchievements.map((achievement) => (
            <span key={achievement} className={achievements.includes(achievement) ? "is-done" : undefined}>
              {achievements.includes(achievement) ? "✓" : "○"} {achievement}
            </span>
          ))}
        </div>
        <div className="terminal-transcript" aria-live="polite">
          <p>Vibe to Code safe shell</p>
          {transcript.map((line, index) => (
            <div key={`${line.command}-${index}`}>
              <code>{index === 0 ? "/home/learner" : "..."} $ {line.command}</code>
              {line.output ? <pre>{line.output}</pre> : null}
            </div>
          ))}
        </div>
        <label id={`${stepId}-terminal-title`} htmlFor={`${stepId}-command`}>Command</label>
        <div className="terminal-command-row">
          <span aria-hidden="true">$</span>
          <input
            id={`${stepId}-command`}
            value={command}
            onChange={(event) => setCommand(event.target.value.slice(0, 80))}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitCommand();
              }
            }}
            autoComplete="off"
            spellCheck={false}
          />
          <button className="button button-primary" type="button" onClick={submitCommand}>
            Run command
          </button>
        </div>
      </div>

      <LabFeedback
        feedback={feedback}
        completed={completed}
        attempts={attempts}
        hint={hint}
        showHint={showHint}
      />
    </section>
  );
}
