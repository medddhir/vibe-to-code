"use client";

import { useMemo, useState } from "react";

import { useLessonProgress } from "@/components/guided-lesson-flow";
import {
  runDecisionScript,
  type DecisionSimulationResult,
  type SimTraceStep,
} from "@/lib/foundations-simulators";
import { ExecutionTrace } from "@/components/foundations/execution-trace";

type FunctionLabProps = {
  stepId: string;
  title: string;
  instructions: string;
  starterCode: string;
  starterInput: number;
  expectedOutput: number;
  hint: string;
};

type FunctionTraceEntry = SimTraceStep & {
  phase: string;
  detail: string;
};

function runFunctionSimulation(code: string, inputValue: number) {
  const source = code.replace(/\r\n?/g, "\n").trim();

  if (!source) {
    return {
      ok: false as const,
      error: "Add one assignment line before running.",
      trace: [] as FunctionTraceEntry[],
    };
  }

  if (!Number.isFinite(inputValue)) {
    return {
      ok: false as const,
      error: "The function input must be a number. Use a small integer or decimal.",
      trace: [],
    };
  }

  const lines = source
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length > 1) {
    return {
      ok: false as const,
      error: "Keep this challenge to one assignment line like `result = input + 2`.",
      trace: [],
    };
  }

  const line = lines[0];
  const match = /^([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*([+\-*/])\s*(-?\d+)$/i.exec(
    line,
  );

  if (!match) {
    return {
      ok: false as const,
      error: "Use exactly: result = input + number (or -, *, /).",
      trace: [] as FunctionTraceEntry[],
    };
  }

  const outputName = match[1];
  const inputName = match[2];
  const operator = match[3];
  const operand = Number(match[4]);

  if (operator === "/" && operand === 0) {
    return {
      ok: false as const,
      error: "Division by zero is not allowed in this challenge.",
      trace: [
        {
          phase: "Division error",
          detail: `input (${inputValue}) / 0 is undefined.`,
          memory: { input: inputValue },
          output: "",
        } as FunctionTraceEntry,
      ],
    };
  }

  if (outputName !== "result") {
    return {
      ok: false as const,
      error: "Store the result in a variable named `result`.",
      trace: [
        {
          phase: "Output assignment",
          detail: "The output variable must be named `result`.",
          output: "",
        } as FunctionTraceEntry,
      ],
    };
  }

  if (inputName.toLowerCase() !== "input") {
    return {
      ok: false as const,
      error: "Use `input` on the right side so your function is reusable for different inputs.",
      trace: [
        {
          phase: "Input binding",
          detail: `Expected input variable, got: ${inputName}`,
          output: "",
        } as FunctionTraceEntry,
      ],
    };
  }

  let result = inputValue;
  let operationLabel = "+";

  switch (operator) {
    case "+":
      result += operand;
      operationLabel = "added";
      break;
    case "-":
      result -= operand;
      operationLabel = "subtracted";
      break;
    case "*":
      result *= operand;
      operationLabel = "multiplied by";
      break;
    case "/":
      result = result / operand;
      operationLabel = "divided by";
      break;
  }

  const trace: FunctionTraceEntry[] = [
    {
      phase: "Input",
      detail: `input = ${inputValue}`,
      memory: { input: inputValue },
    },
    {
      phase: "Rule",
      detail: `result = input ${operator} ${operand}`,
      memory: {
        input: inputValue,
        operation: `${operationLabel} ${operand}`,
      },
    },
    {
      phase: "Function output",
      detail: `The function returns ${result}`,
      output: String(result),
      memory: { result },
    },
  ];

  return {
    ok: true as const,
    result,
    trace,
  };
}

export function DecisionFunctionLab({
  stepId,
  title,
  instructions,
  starterCode,
  starterInput,
  expectedOutput,
  hint,
}: FunctionLabProps) {
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
  const [inputText, setInputText] = useState(String(starterInput));
  const [code, setCode] = useState(starterCode);
  const [trace, setTrace] = useState<FunctionTraceEntry[]>([]);
  const [output, setOutput] = useState("Press run to evaluate the function.");
  const [message, setMessage] = useState(
    "Press run to evaluate the formula with your input.",
  );
  const [resultType, setResultType] = useState<"neutral" | "success" | "error" | "warning">(
    "neutral",
  );
  const showHint = attempts >= 3 && !completed;

  const parsedInput = useMemo(() => Number(inputText), [inputText]);

  function runFunction() {
    saveCode(stepId, code);

    const runner = runFunctionSimulation(code, parsedInput);

    if (!runner.ok) {
      setResultType("error");
      setMessage(runner.error);
      setOutput("Error");
      setTrace(runner.trace);
      if (!completed) {
        recordFailedAttempt(stepId);
        if (attempts === 2) {
          recordHintUsage(stepId);
        }
      }
      return;
    }

    const outputValue = runner.result;
    const outputText = String(outputValue);

    setOutput(outputText);
    setTrace(runner.trace);

    if (outputValue === expectedOutput) {
      setResultType("success");
      setMessage(`Great. For input ${parsedInput}, this function returns ${expectedOutput}.`);
      completePractice(stepId);
      return;
    }

    setResultType("warning");
    setMessage(
      `Try again. For input ${parsedInput}, expected function output is ${expectedOutput}.`,
    );
    if (!completed) {
      recordFailedAttempt(stepId);
      if (attempts === 2) {
        recordHintUsage(stepId);
      }
    }
  }

  return (
    <section className="choice-checkpoint" aria-labelledby={`${stepId}-function-title`}>
      <div className="choice-checkpoint-heading">
        <div>
          <p className="eyebrow">Function checkpoint</p>
          <h3 id={`${stepId}-function-title`}>{title}</h3>
        </div>
        <span className={completed ? "is-passed" : undefined}>
          <i aria-hidden="true">{completed ? "✓" : "◎"}</i>
          {completed ? "Completed" : "Your turn"}
        </span>
      </div>

      <div className="practice-console-window" role="group" aria-label="Function input controls">
        <div className="practice-console-bar" aria-hidden="true">
          <span />
          <span />
          <span />
          <small>function-lab.py · safe simulation</small>
        </div>

        <div className="practice-editor-wrap">
          <p className="practice-console-instructions">{instructions}</p>
          <label htmlFor={`${stepId}-input`}>Function input</label>
          <div className="choice-checkpoint-actions" style={{ marginBottom: 8 }}>
            <input
              id={`${stepId}-input`}
              type="number"
              value={inputText}
              onChange={(event) => setInputText(event.target.value)}
              style={{ maxWidth: 180 }}
              aria-label="Function input"
            />
            <button
              className="button button-primary"
              type="button"
              onClick={() => runFunction()}
            >
              Run function
            </button>
            <button
              className="button button-secondary"
              type="button"
              onClick={() => {
                setCode(starterCode);
                setInputText(String(starterInput));
                setTrace([]);
                setOutput("Press run to evaluate the function.");
                setMessage("Press run to evaluate the formula with your input.");
                setResultType("neutral");
              }}
            >
              Reset
            </button>
          </div>

          <label htmlFor={`${stepId}-function-code`}>Function body</label>
          <textarea
            id={`${stepId}-function-code`}
            value={code}
            rows={2}
            onChange={(event) => setCode(event.target.value.slice(0, 220))}
            style={{ width: "100%", marginBottom: 10 }}
            aria-label="Function body editor"
            spellCheck={false}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>

        <div
          className={`practice-output${resultType === "success" ? " is-success" : ""}`}
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <div className="practice-output-label">
            <span>Output</span>
          </div>
          <p>{message}</p>
          <pre>{output}</pre>
          <div style={{ marginTop: 8 }}>
            <ExecutionTrace
              label="Function trace"
              entries={trace.map((entry) => ({
                ...entry,
                output: entry.output,
              }))}
            />
          </div>
        </div>
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

type ScriptLabMode = "Pass" | "Retry" | "either";

type DecisionScriptLabProps = {
  stepId: string;
  title: string;
  instructions: string;
  starterCode: string;
  target: ScriptLabMode;
  expectedFinalScore?: number;
  expectedOutputContains?: string;
  hint: string;
  stepByStep?: boolean;
};

function normalizeResult(result: DecisionSimulationResult) {
  const output = result.output ? result.output : "";
  const outputDecision = output.startsWith("Decision is ")
    ? output.replace("Decision is ", "").trim()
    : "Unknown";
  const decision = (outputDecision as "Pass" | "Retry" | "Unknown") ?? "Unknown";

  return {
    output,
    outputDecision: decision,
  };
}

export function DecisionScriptLab({
  stepId,
  title,
  instructions,
  starterCode,
  target,
  expectedFinalScore,
  expectedOutputContains,
  hint,
  stepByStep = true,
}: DecisionScriptLabProps) {
  const {
    attemptsByStep,
    practiceCompletedIds,
    completePractice,
    recordFailedAttempt,
    recordHintUsage,
    saveCode,
  } = useLessonProgress();

  const completed = practiceCompletedIds.includes(stepId);
  const attempts = attemptsByStep[stepId] ?? 0;
  const [code, setCode] = useState(starterCode);
  const [result, setResult] = useState<DecisionSimulationResult | null>(null);
  const [traceIndex, setTraceIndex] = useState(3);
  const [feedback, setFeedback] = useState("Run the program to see each decision step.");
  const [outputState, setOutputState] = useState<"neutral" | "success" | "error" | "warning">(
    "neutral",
  );
  const showHint = attempts >= 3 && !completed;

  function runScript() {
    saveCode(stepId, code);
    const simulation = runDecisionScript(code);
    setResult(simulation);
    setTraceIndex(simulation.trace.length > 0 ? 1 : 0);

    if (!simulation.ok) {
      setOutputState("error");
      setFeedback(simulation.friendlyMessage ?? "The script is not valid yet.");
      if (!completed) {
        recordFailedAttempt(stepId);
        if (attempts === 2) {
          recordHintUsage(stepId);
        }
      }
      return;
    }

    const normalized = normalizeResult(simulation);
    const decision = normalized.outputDecision;
    const score = simulation.finalScore ?? 0;
    const outputMatches =
      (target === "either" || decision === target) &&
      (expectedFinalScore === undefined || score === expectedFinalScore) &&
      (!expectedOutputContains || normalized.output.includes(expectedOutputContains));

    if (outputMatches) {
      setOutputState("success");
      setFeedback(
        target === "either"
          ? "Great. This script produces the target behavior and the trace shows each program check."
          : `Excellent. The decision is ${target} and your state trace is valid.`,
      );
      completePractice(stepId);
      return;
    }

    setOutputState("warning");
    if (target === "either") {
      setFeedback(
        `You got ${decision}. Change one line and run again until the output matches the required path.`,
      );
    } else {
      setFeedback(`You got ${decision}. The target is ${target}. Update the condition or loop, then run again.`);
    }

    if (!completed) {
      recordFailedAttempt(stepId);
      if (attempts === 2) {
        recordHintUsage(stepId);
      }
    }
  }

  function nextTrace() {
    if (!result) {
      return;
    }

    setTraceIndex((current) => Math.min(current + 1, result.trace.length));
  }

  function resetTrace() {
    setTraceIndex(1);
  }

  const visibleTrace = result ? result.trace.slice(0, traceIndex) : [];

  return (
    <section className="choice-checkpoint" aria-labelledby={`${stepId}-script-title`}>
      <div className="choice-checkpoint-heading">
        <div>
          <p className="eyebrow">Execution checkpoint</p>
          <h3 id={`${stepId}-script-title`}>{title}</h3>
        </div>
        <span className={completed ? "is-passed" : undefined}>
          <i aria-hidden="true">{completed ? "✓" : "◎"}</i>
          {completed ? "Completed" : "Your turn"}
        </span>
      </div>

      <p className="practice-console-instructions">{instructions}</p>

      <div className="practice-editor-wrap" style={{ paddingBottom: 0 }}>
        <label htmlFor={`${stepId}-decision-script`}>Restricted decision script</label>
        <textarea
          id={`${stepId}-decision-script`}
          value={code}
          rows={7}
          onChange={(event) => setCode(event.target.value.slice(0, 2000))}
          style={{ width: "100%", minHeight: 130 }}
          spellCheck={false}
          autoCapitalize="off"
          autoCorrect="off"
        />
        <div className="choice-checkpoint-actions" style={{ marginTop: 10 }}>
          <button className="button button-primary" type="button" onClick={() => runScript()}>
            Run script
          </button>
          {stepByStep && result?.trace?.length ? (
            <>
              <button
                className="button button-secondary"
                type="button"
                onClick={nextTrace}
                disabled={traceIndex >= (result?.trace.length ?? 0)}
              >
                Next step ({traceIndex}/{result?.trace.length})
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={resetTrace}
                disabled={!result}
              >
                Reset trace
              </button>
            </>
          ) : null}
        </div>
      </div>

      <div
        className={`practice-output is-${outputState}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <div className="practice-output-label">
          <span>Output</span>
          <small>{attempts > 0 && !completed ? `Attempt ${attempts + 1}` : null}</small>
        </div>
        <p>{feedback}</p>
        <pre>{result?.output || ""}</pre>
        {result && result.trace.length ? <ExecutionTrace label="Execution trace" entries={visibleTrace} /> : null}
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
