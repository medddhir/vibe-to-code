export type SimValue = string | number | boolean | null;

export type SimMemory = Record<string, SimValue>;

export type SimTraceStep = {
  phase: string;
  detail: string;
  memory?: SimMemory;
  output?: string;
};

export type DecisionSimulationResult = {
  ok: boolean;
  output?: string;
  error?: string;
  friendlyMessage?: string;
  finalScore?: number;
  decision?: "Pass" | "Retry" | "Unknown";
  trace: SimTraceStep[];
};

export function runDecisionScript(source: string): DecisionSimulationResult {
  const trace: SimTraceStep[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n").map((line) => line.trim());
  const code = lines.filter((line) => line && !line.startsWith("#"));

  if (code.length === 0) {
    return {
      ok: false,
      error: "Your script is empty.",
      friendlyMessage: "Start with `score = 1` and then add one condition.",
      trace,
    };
  }

  const memory: SimMemory = {};
  let index = 0;

  const assignmentPattern = /^([A-Za-z_]\w*)\s*=\s*(-?\d+)$/;
  const stringAssignPattern = /^([A-Za-z_]\w*)\s*=\s*["'](Pass|Retry)["']$/;
  const conditionPattern = /^if\s+([A-Za-z_]\w*)\s*(==|!=|<=|>=|<|>|=)\s*(-?\d+)\s*:\n?$/;
  const whilePattern = /^while\s+([A-Za-z_]\w*)\s*(<=|>=|<|>|==|!=)\s*(-?\d+)\s*:\n?$/;
  const incPattern = /^([A-Za-z_]\w*)\s*=\s*\1\s*\+\s*1$/;
  const outputPattern = /^outcome\s*=\s*["'](Pass|Retry)["']$/;

  const readVar = (name: string) => {
    if (!(name in memory)) {
      throw new Error(`Variable ${name} is not defined yet. Define it before using it.`);
    }

    const value = memory[name];
    if (typeof value !== "number") {
      throw new Error(`Variable ${name} is not a number in this step.`);
    }

    return value;
  };

  const boolFromCompare = (left: number, operator: string, right: number) => {
    switch (operator) {
      case "==":
        return left === right;
      case "!=":
        return left !== right;
      case "<":
        return left < right;
      case ">":
        return left > right;
      case "<=":
        return left <= right;
      case ">=":
        return left >= right;
      default:
        throw new Error(`Unsupported operator '${operator}'.`);
    }
  };

  const assignLine = code[index];
  const firstAssign = assignmentPattern.exec(assignLine);
  if (!firstAssign) {
    return {
      ok: false,
      error: "Missing initial score assignment.",
      friendlyMessage:
        "Start your script with `score = 1` (or any number) so the lesson can reason about a value.",
      trace,
    };
  }

  memory[firstAssign[1]] = Number(firstAssign[2]);
  trace.push({
    phase: "assignment",
    detail: `Assigned ${firstAssign[1]} = ${firstAssign[2]}`,
    memory: { ...memory },
  });
  index += 1;

  let reachedWhile = false;

  while (index < code.length) {
    const current = code[index];

    const whileMatch = whilePattern.exec(current);
    if (whileMatch) {
      if (reachedWhile) {
        return {
          ok: false,
          error: "Only one loop block is supported in this step.",
          friendlyMessage: "Use one small while loop only.",
          trace,
        };
      }

      reachedWhile = true;
      const variable = whileMatch[1];
      const operator = whileMatch[2];
      const bound = Number(whileMatch[3]);

      const bodyLine = code[index + 1];
      if (!bodyLine || !incPattern.test(bodyLine)) {
        return {
          ok: false,
          error: "The loop body must increment by one.",
          friendlyMessage: "Write body line exactly like `score = score + 1`.",
          trace,
        };
      }

      const maxIterations = 12;
      let safe = 0;
      while (safe < maxIterations) {
        const left = readVar(variable);
        if (!boolFromCompare(left, operator, bound)) {
          trace.push({
            phase: "loop condition",
            detail: `Loop ended because ${variable} (${left}) is not ${operator} ${bound}`,
            memory: { ...memory },
          });
          break;
        }

        trace.push({
          phase: "loop check",
          detail: `Iteration ${safe + 1}: ${variable} (${left}) is ${operator} ${bound}`,
          memory: { ...memory },
        });

        const match = incPattern.exec(bodyLine);
        if (!match) {
          return {
            ok: false,
            error: "Unsupported loop body expression.",
            friendlyMessage: "Use `score = score + 1` while stepping.",
            trace,
          };
        }

        const bodyVar = match[1];
        memory[bodyVar] = readVar(bodyVar) + 1;
        trace.push({
          phase: "loop body",
          detail: `${bodyVar} = ${bodyVar} + 1`,
          memory: { ...memory },
        });
        safe += 1;
      }

      if (safe >= maxIterations && boolFromCompare(readVar(variable), operator, bound)) {
        return {
          ok: false,
          error: "This loop never stops. The change never leaves the loop condition.",
          friendlyMessage: "Make sure the loop body changes the checked variable so it can finish.",
          trace,
        };
      }

      index += 2;
      continue;
    }

    const conditionMatch = conditionPattern.exec(current);
    if (conditionMatch) {
      const variable = conditionMatch[1];
      const operator = conditionMatch[2];
      const right = Number(conditionMatch[3]);

      if (operator === "=") {
        return {
          ok: false,
          error: "Use `==` for comparison, not `=`.",
          friendlyMessage: "In conditions, `=` assigns. Use `==` to compare two values.",
          trace,
        };
      }

      const left = readVar(variable);
      const conditionMet = boolFromCompare(left, operator, right);

      trace.push({
        phase: "condition",
        detail: `${variable} ${operator} ${right} is ${conditionMet ? "true" : "false"}`,
        memory: { ...memory },
      });

      const trueBranch = outputPattern.exec(code[index + 1] ?? "");
      const falseOutcome = outputPattern.exec(code[index + 3] ?? "");

      if (!trueBranch || code[index + 2] !== "else:" || !falseOutcome) {
        return {
          ok: false,
          error: "Expected an if/else with two outcome lines.",
          friendlyMessage: "Use: if condition, an outcome, else, and another outcome.",
          trace,
        };
      }

      const chosen = conditionMet ? trueBranch[1] : falseOutcome[1];
      memory.outcome = chosen;
      trace.push({
        phase: "decision",
        detail: `Path set to ${chosen}`,
        output: chosen,
        memory: { ...memory },
      });
      index += 4;
      continue;
    }

    const directString = stringAssignPattern.exec(current);
    if (directString) {
      memory[directString[1]] = directString[2];
      trace.push({
        phase: "assignment",
        detail: `Set ${directString[1]} = ${directString[2]}`,
        memory: { ...memory },
      });
      index += 1;
      continue;
    }

    if (incPattern.test(current)) {
      const match = incPattern.exec(current);
      if (!match) {
        return {
          ok: false,
          error: "Unsupported increment expression.",
          friendlyMessage: "Use `score = score + 1` only.",
          trace,
        };
      }

      const target = match[1];
      memory[target] = readVar(target) + 1;
      trace.push({ phase: "assignment", detail: `${target} = ${target} + 1`, memory: { ...memory } });
      index += 1;
      continue;
    }

    const assignmentNumeric = assignmentPattern.exec(current);
    if (assignmentNumeric) {
      memory[assignmentNumeric[1]] = Number(assignmentNumeric[2]);
      trace.push({
        phase: "assignment",
        detail: `${assignmentNumeric[1]} = ${assignmentNumeric[2]}`,
        memory: { ...memory },
      });
      index += 1;
      continue;
    }

    return {
      ok: false,
      error: `Unsupported line: ${current}`,
      friendlyMessage: "Keep to the guided subset: assignments, one if/else, and simple loop increment.",
      trace,
    };
  }

  const decision = (memory.outcome as "Pass" | "Retry" | undefined) ?? "Unknown";

  return {
    ok: true,
    output: `Decision is ${decision}`,
    finalScore: Number(memory.score ?? 0),
    decision,
    trace,
  };
}

export function evaluateThresholdFunction(input: number) {
  if (!Number.isFinite(input)) {
    return {
      ok: false,
      message: "Input must be a number.",
      output: "",
    };
  }

  const isPass = input >= 5;
  return {
    ok: true,
    output: isPass ? "Pass" : "Retry",
    score: input,
  };
}

export type StateUpdateOutput = {
  ok: boolean;
  output: string;
  error?: string;
  friendlyMessage?: string;
  state: number;
  trace: SimTraceStep[];
};

export function runStateUpdate(
  startState: number,
  payload: string,
  formula: string,
): StateUpdateOutput {
  const trace: SimTraceStep[] = [];
  const input = Number(payload);
  const trimmedFormula = formula.trim();

  if (!Number.isFinite(startState)) {
    return {
      ok: false,
      error: "Current state is invalid.",
      friendlyMessage: "Reset this checkpoint and start from zero.",
      output: "",
      state: startState,
      trace,
    };
  }

  if (!Number.isFinite(input)) {
    return {
      ok: false,
      error: "Enter a real number to continue.",
      friendlyMessage: "The input value must be a number so the screen can calculate safely.",
      output: "",
      state: startState,
      trace,
    };
  }

  if (!trimmedFormula) {
    return {
      ok: false,
      error: "Add one update formula before running.",
      friendlyMessage: "Use `state = state + 1` or `state = state + input`.",
      output: "",
      state: startState,
      trace,
    };
  }

  const formulaMatch = /^state\s*=\s*state\s*([+\-*/])\s*(state|input|\-?\d+)$/;
  const match = formulaMatch.exec(trimmedFormula);

  if (!match) {
    return {
      ok: false,
      error: "Formula pattern not recognized.",
      friendlyMessage:
        "Keep the right side like `state + input` or `state + 2` with `state` on the left.",
      output: "",
      state: startState,
      trace,
    };
  }

  const operator = match[1];
  const rightRaw = match[2];

  const rightValue =
    rightRaw === "state" ? startState : rightRaw === "input" ? input : Number(rightRaw);

  if (!Number.isFinite(rightValue)) {
    return {
      ok: false,
      error: "Formula includes a non-number value.",
      friendlyMessage: "Use input, state, or a plain number on the formula right-hand side.",
      output: "",
      state: startState,
      trace,
    };
  }

  let nextState = startState;

  switch (operator) {
    case "+":
      nextState = startState + rightValue;
      break;
    case "-":
      nextState = startState - rightValue;
      break;
    case "*":
      nextState = startState * rightValue;
      break;
    case "/":
      if (rightValue === 0) {
        return {
          ok: false,
          error: "Division by zero is not allowed in this challenge.",
          friendlyMessage: "Use a non-zero value on the right side of `/`.",
          output: `state = ${startState}`,
          state: startState,
          trace,
        };
      }
      nextState = startState / rightValue;
      break;
    default:
      return {
        ok: false,
        error: "Unsupported operation.",
        friendlyMessage: "Only +, -, *, / are accepted.",
        output: "",
        state: startState,
        trace,
      };
  }

  if (!Number.isFinite(nextState)) {
    return {
      ok: false,
      error: "The update produced an invalid state.",
      friendlyMessage: "Check your arithmetic. Small number values are safer.",
      output: `state = ${startState}`,
      state: startState,
      trace,
    };
  }

  trace.push({ phase: "input", detail: `Input event: ${input}`, memory: { input } });
  trace.push({
    phase: "update",
    detail: `state = state ${operator} ${rightRaw}`,
    output: String(nextState),
    memory: { state: nextState, input },
  });

  return {
    ok: true,
    output: `state = ${nextState}`,
    state: nextState,
    trace,
  };
}

type JourneyRouteLanguage = "Python" | "JavaScript" | "Compiled app";
type JourneyLanguage = "python" | "javascript" | "compiled";
type JourneyMode = "normal" | "broken-runtime";

export type JourneyRouteStep = {
  phase: string;
  role: "source" | "interpreter" | "compiler" | "runtime" | "machine" | "result";
  detail: string;
};

export type JourneySimulation = {
  language: JourneyLanguage;
  routeLabel: JourneyRouteLanguage;
  steps: JourneyRouteStep[];
  result: string;
  routeTagline: string;
};

const JOURNEY_LIBRARY: Record<JourneyLanguage, JourneyRouteStep[]> = {
  python: [
    {
      phase: "Source",
      role: "source",
      detail: "You write readable Python statements like math and text operations.",
    },
    { phase: "Interpreter", role: "interpreter", detail: "The Python interpreter converts source into bytecode in memory." },
    {
      phase: "Runtime engine",
      role: "runtime",
      detail: "The Python runtime executes the bytecode and tracks variable memory safely.",
    },
    { phase: "Output", role: "result", detail: "The runtime writes the result to the console." },
  ],
  javascript: [
    { phase: "Source", role: "source", detail: "You write JavaScript text for a browser or server." },
    { phase: "JIT + engine", role: "interpreter", detail: "The JS engine parses, optimizes, and runs the script." },
    {
      phase: "Environment API",
      role: "runtime",
      detail: "The runtime provides DOM and network APIs available to your program.",
    },
    { phase: "Output", role: "result", detail: "A value appears in the page or network request." },
  ],
  compiled: [
    {
      phase: "Source",
      role: "source",
      detail: "You write source code in a language like C++ or Rust.",
    },
    {
      phase: "Compiler",
      role: "compiler",
      detail: "The compiler turns your source into machine instructions.",
    },
    {
      phase: "Link + OS loader",
      role: "runtime",
      detail: "The binary is packaged and loaded by the operating system.",
    },
    { phase: "CPU", role: "machine", detail: "Processor instructions run directly as machine code." },
    { phase: "Output", role: "result", detail: "The OS returns a process exit code and output data." },
  ],
};

export function simulateCodeJourney(language: JourneyLanguage, mode: JourneyMode = "normal"): JourneySimulation {
  const normalized = JOURNEY_LIBRARY[language];
  const languageLabel = language === "python" ? "Python" : language === "javascript" ? "JavaScript" : "Compiled app";

  if (mode === "broken-runtime" && language === "python") {
    return {
      language,
      routeLabel: languageLabel,
      routeTagline: "This is a browser-like context without a Python runtime."
        + " In real life, this script needs an installed Python engine.",
      result: "Runtime missing: no Python interpreter available.",
      steps: normalized.slice(0, 2).concat([
        { phase: "Runtime missing", role: "runtime", detail: "No interpreter is installed." },
      ]),
    };
  }

  if (mode === "broken-runtime" && language === "compiled") {
    return {
      language,
      routeLabel: languageLabel,
      routeTagline: "This binary requires an unsupported ABI for this environment.",
      result: "Runtime error: incompatible machine mode.",
      steps: normalized.slice(0, 3).concat([
        { phase: "ABI check", role: "runtime", detail: "CPU features mismatch this machine." },
      ]),
    };
  }

  const result =
    language === "compiled"
      ? "Program exits with code 0 and writes expected output."
      : `Program output: Hello, mission learner.`;

  return {
    language,
    routeLabel: languageLabel,
    routeTagline:
      mode === "normal" ? "Code flows from text to execution context in deterministic, language-specific steps." : "Failure occurred.",
    result,
    steps: normalized,
  };
}

export type FileLanguage = "html" | "css" | "javascript";

export type SyntaxIssue = {
  file: FileLanguage;
  message: string;
};

export type SyntaxSimulationResult = {
  file: FileLanguage;
  issues: SyntaxIssue[];
  passed: boolean;
};

export function validateLanguageFile(file: FileLanguage, source: string): SyntaxIssue[] {
  const issues: SyntaxIssue[] = [];
  const trimmed = source.trim();

  if (!trimmed) {
    issues.push({ file, message: "This file is empty. Add minimal valid content to continue." });
    return issues;
  }

  if (file === "html") {
    if (!/<html\b/i.test(trimmed) || !/<\/html>/i.test(trimmed)) {
      issues.push({ file, message: "HTML should include <html> and </html> tags." });
    }
    if (!/<body\b/i.test(trimmed)) {
      issues.push({ file, message: "Add a <body> section so you can see visible content." });
    }
    if (/<script[^>]*>[\s\S]*?<\/script>/i.test(trimmed)) {
      // Inline script is okay only if the file is HTML script placeholder is not needed.
    }
    return issues;
  }

  if (file === "css") {
    const openBraces = (trimmed.match(/\{/g) || []).length;
    const closeBraces = (trimmed.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      issues.push({ file, message: "Your CSS braces are unbalanced. Add matching { } pairs." });
    }
    if (/{/.test(trimmed) && !/:[^;]+;/.test(trimmed)) {
      issues.push({ file, message: "Write one declaration like color: blue; for each CSS rule." });
    }
    if (/<|>/.test(trimmed)) {
      issues.push({ file, message: "Keep HTML-like `<` `>` characters out of CSS files." });
    }
    return issues;
  }

  if (file === "javascript") {
    if (/\b(print)\s*\(/.test(trimmed)) {
      issues.push({ file, message: "This sandbox uses JavaScript `console.log(...)`, not Python `print(...)`." });
    }
    if (/\bprint\s*=/.test(trimmed)) {
      issues.push({ file, message: "Avoid overwriting built-in words in this tiny safety preview." });
    }
    if (!/\;/.test(trimmed) && trimmed.includes("=") && !trimmed.includes("=>")) {
      issues.push({ file, message: "For this lesson, end statements with a semicolon to make the parser predictable." });
    }
    return issues;
  }

  return issues;
}

export function validateLanguagePack(files: Record<FileLanguage, string>): SyntaxSimulationResult[] {
  return (Object.keys(files) as FileLanguage[]).map((file) => {
    const issues = validateLanguageFile(file, files[file] ?? "");
    return {
      file,
      issues,
      passed: issues.length === 0,
    };
  });
}

export type LanguagePreviewPack = {
  html: string;
  css: string;
  javascript: string;
};

const ALLOWED_PREVIEW_TAGS = new Set([
  "html",
  "head",
  "body",
  "main",
  "section",
  "article",
  "p",
  "div",
  "span",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "strong",
  "em",
  "b",
  "i",
  "small",
  "code",
  "pre",
  "button",
  "label",
  "input",
  "a",
  "br",
]);

const PREVIEW_ALLOWED_ATTRIBUTES = new Set([
  "id",
  "class",
  "type",
  "name",
  "value",
  "for",
  "disabled",
  "readonly",
  "placeholder",
  "maxlength",
  "min",
  "max",
  "step",
  "title",
  "aria-label",
  "role",
]);

const PREVIEW_BAD_ATTRIBUTE_PREFIXES = [
  "on",
];

const PREVIEW_BAD_ATTRIBUTE_NAMES = new Set([
  "style",
  "src",
  "href",
  "action",
  "formaction",
  "xlink:href",
  "srcset",
  "poster",
  "background",
  "data",
  "dynsrc",
  "lowsrc",
  "longdesc",
]);

const PREVIEW_DANGEROUS_VALUE_PATTERNS = [
  /javascript:/i,
  /vbscript:/i,
  /data:/i,
  /file:/i,
  /\/\/./i,
  /expression\s*\(/i,
  /url\s*\(/i,
  /@import/i,
];

const ALLOWED_CSS_SELECTORS = new Set([
  "body",
  ".card",
  ".banner",
  ".status",
  "p",
  "button",
  "main",
]);

const SAFE_COLOR_VALUE = /^(?:[a-z]+|#[0-9a-f]{3}|#[0-9a-f]{6})$/i;
const SAFE_KEYWORD_COLOR_VALUE = /^(transparent|inherit|initial|currentColor)$/i;
const SAFE_UNIT_VALUE = /^(?:0|(?:-?\d+(?:\.\d+)?)(?:px|rem|em|%))$/i;
const SAFE_LENGTH_LIST_VALUE = new RegExp(
  `^(?:${SAFE_UNIT_VALUE.source}|0)(?:\\s+(?:${SAFE_UNIT_VALUE.source}|0)){0,3}$`,
  "i",
);
const SAFE_FONT_FAMILY_VALUE = /^[a-z0-9\\-\\s,'"]+$/i;

const ALLOWED_CSS_PROPERTY_VALIDATORS: Record<string, RegExp> = {
  color: new RegExp(`^(?:${SAFE_COLOR_VALUE.source}|${SAFE_KEYWORD_COLOR_VALUE.source})$`, "i"),
  "background-color": new RegExp(`^(?:${SAFE_COLOR_VALUE.source}|${SAFE_KEYWORD_COLOR_VALUE.source}|none)$`, "i"),
  background: new RegExp(`^(?:${SAFE_COLOR_VALUE.source}|${SAFE_KEYWORD_COLOR_VALUE.source}|none)$`, "i"),
  margin: SAFE_LENGTH_LIST_VALUE,
  "margin-top": SAFE_UNIT_VALUE,
  "margin-right": SAFE_UNIT_VALUE,
  "margin-bottom": SAFE_UNIT_VALUE,
  "margin-left": SAFE_UNIT_VALUE,
  padding: SAFE_LENGTH_LIST_VALUE,
  "padding-top": SAFE_UNIT_VALUE,
  "padding-right": SAFE_UNIT_VALUE,
  "padding-bottom": SAFE_UNIT_VALUE,
  "padding-left": SAFE_UNIT_VALUE,
  "font-family": SAFE_FONT_FAMILY_VALUE,
  "font-weight": /^(?:normal|bold|bolder|lighter|[1-9]00)$/i,
  "font-size": SAFE_UNIT_VALUE,
  "text-align": /^(?:left|center|right|justify)$/i,
  display: /^(?:block|inline|inline-block|flex|grid|none)$/i,
  width: new RegExp(`^(?:${SAFE_UNIT_VALUE.source}|auto)$`, "i"),
  "max-width": new RegExp(`^(?:${SAFE_UNIT_VALUE.source}|none|auto)$`, "i"),
  "min-width": new RegExp(`^(?:${SAFE_UNIT_VALUE.source}|0|auto)$`, "i"),
  height: new RegExp(`^(?:${SAFE_UNIT_VALUE.source}|auto)$`, "i"),
  "min-height": new RegExp(`^(?:${SAFE_UNIT_VALUE.source}|0|auto)$`, "i"),
  "max-height": new RegExp(`^(?:${SAFE_UNIT_VALUE.source}|none|auto)$`, "i"),
  "line-height": SAFE_UNIT_VALUE,
  gap: SAFE_UNIT_VALUE,
  "border-radius": SAFE_UNIT_VALUE,
  "box-sizing": /^(?:content-box|border-box)$/i,
};

const CSS_FORBIDDEN_PATTERNS = [
  /\/\*[\s\S]*?\*\//,
  /\\(?:\r?\n)?/,
  /@/,
  /</,
  />/,
  /javascript:/i,
  /vbscript:/i,
  /data:/i,
  /blob:/i,
  /file:/i,
  /\/\/\s*[^\s"]+/,
  /http:\/\//i,
  /https:\/\//i,
  /\/\/[^\s"']+/,
  /expression\s*\(/i,
  /url\s*\(/i,
  /image-set\s*\(/i,
  /-webkit-image-set\s*\(/i,
  /cross-fade\s*\(/i,
  /element\s*\(/i,
  /paint\s*\(/i,
  /behavior/i,
  /binding/i,
];

function stripUnsafeTagBlocks(source: string) {
  const stripped = source
    .replace(/<script\b[^>]*>[\s\S]*?(<\/script\s*>|$)/gi, "")
    .replace(/<style\b[^>]*>[\s\S]*?(<\/style\s*>|$)/gi, "")
    .replace(/<\/?style\b[^>]*>/gi, "")
    .replace(/<\/?script\b[^>]*>/gi, "")
    .replace(/<iframe\b[^>]*>[\s\S]*?(<\/iframe\s*>|$)/gi, "")
    .replace(/<img\b[^>]*>/gi, "")
    .replace(/<object\b[^>]*>[\s\S]*?(<\/object\s*>|$)/gi, "")
    .replace(/<embed\b[^>]*>/gi, "")
    .replace(/<link\b[^>]*>/gi, "")
    .replace(/<meta\b[^>]*>/gi, "")
    .replace(/<form\b[^>]*>[\s\S]*?(<\/form\s*>|$)/gi, "")
    .replace(/<\/?script\b[^>]*>/gi, "");
  return stripped;
}

function sanitizeAttrValue(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .trim();
}

function sanitizeHtmlAttribute(rawName: string, rawValue: string | undefined) {
  const name = rawName.toLowerCase();

  if (PREVIEW_BAD_ATTRIBUTE_NAMES.has(name) || name.startsWith("data-")) {
    return "";
  }

  const hasBadPrefix = PREVIEW_BAD_ATTRIBUTE_PREFIXES.some((prefix) =>
    name.startsWith(prefix),
  );
  if (hasBadPrefix) {
    return "";
  }

  if (!PREVIEW_ALLOWED_ATTRIBUTES.has(name)) {
    return "";
  }

  if (rawValue === undefined) {
    return ` ${name}`;
  }

  if (PREVIEW_DANGEROUS_VALUE_PATTERNS.some((pattern) => pattern.test(rawValue))) {
    return "";
  }

  return ` ${name}="${sanitizeAttrValue(rawValue)}"`;
}

function sanitizeTagMarkup(tag: string) {
  const closeMatch = /^<\s*\/\s*([a-z][\w:-]*)\s*>$/i.exec(tag);
  if (closeMatch) {
    const closingTag = closeMatch[1].toLowerCase();
    return ALLOWED_PREVIEW_TAGS.has(closingTag) ? `</${closingTag}>` : "";
  }

  const openMatch = /^<\s*([a-z][\w:-]*)([^>]*)\/?\s*>$/i.exec(tag);
  if (!openMatch) {
    return "";
  }

  const tagName = openMatch[1].toLowerCase();
  const rawAttrs = openMatch[2] ?? "";

  if (!ALLOWED_PREVIEW_TAGS.has(tagName)) {
    return "";
  }

  const attrs = Array.from(rawAttrs.matchAll(/\s+([^\s=>/]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>/`]+)))?/gi))
    .map((match) => sanitizeHtmlAttribute(match[1], match[2] ?? match[3] ?? match[4]))
    .filter(Boolean)
    .join("");

  return `<${tagName}${attrs}>`;
}

function sanitizeMarkupForPreview(markup: string) {
  const safeMarkup = stripUnsafeTagBlocks(markup);
  const tokenPattern = /<[^>]*>|[^<]+/g;
  const sanitized = [];
  let match = tokenPattern.exec(safeMarkup);

  while (match !== null) {
    const token = match[0];
    if (token.startsWith("<")) {
      sanitized.push(sanitizeTagMarkup(token));
    } else {
      sanitized.push(token);
    }

    match = tokenPattern.exec(safeMarkup);
  }

  return sanitized.join("");
}

function collectHeadStyles(markup: string) {
  const matches = Array.from(markup.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi));
  return matches.map((entry) => sanitizeCssForPreview(entry[1] ?? "")).join("\n");
}

function sanitizeCssForPreview(css: string) {
  if (!css) {
    return "";
  }

  if (css.length > 1200) {
    return "";
  }

  if (CSS_FORBIDDEN_PATTERNS.some((pattern) => pattern.test(css))) {
    return "";
  }

  const safeRules: string[] = [];
  let cursor = 0;
  const totalLength = css.length;

  while (cursor < totalLength) {
    const nextOpen = css.indexOf("{", cursor);
    if (nextOpen === -1) {
      break;
    }

    const selectorRaw = css.slice(cursor, nextOpen).trim();
    if (!selectorRaw) {
      return "";
    }

    const nextClose = css.indexOf("}", nextOpen + 1);
    if (nextClose === -1) {
      return "";
    }

    const declarationBlock = css.slice(nextOpen + 1, nextClose).trim();
    const declarationParts = declarationBlock
      .split(";")
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (!declarationParts.length) {
      return "";
    }

    if (declarationBlock.includes("{") || declarationBlock.includes("}")) {
      return "";
    }

    const sanitizedSelector = sanitizeCssSelector(selectorRaw);
    if (!sanitizedSelector) {
      return "";
    }

    const safeDeclarations = declarationParts.map((declaration) => {
      const [rawProperty, ...restValue] = declaration.split(":");
      if (!rawProperty || restValue.length === 0) {
        return "";
      }

      const property = rawProperty.trim().toLowerCase();
      const value = restValue.join(":").trim();

      const validator = ALLOWED_CSS_PROPERTY_VALIDATORS[property];
      if (!validator || !validator.test(value)) {
        return "";
      }

      return `${property}: ${value}`;
    });

    if (safeDeclarations.some((entry) => !entry)) {
      return "";
    }

    safeRules.push(`${sanitizedSelector} { ${safeDeclarations.join("; ")}; }`);

    cursor = nextClose + 1;
  }

  if (!safeRules.length) {
    return "";
  }

  const trailing = css.slice(cursor).trim();
  if (trailing) {
    return "";
  }

  return safeRules.join("\n");
}

function sanitizeCssSelector(selector: string) {
  const normalized = selector.trim();

  if (!ALLOWED_CSS_SELECTORS.has(normalized)) {
    return "";
  }

  return normalized;
}

export function buildLanguagePreview(pack: LanguagePreviewPack) {
  const bodyMatch = /<body[^>]*>([\s\S]*?)<\/body>/i.exec(pack.html);
  const headMatch = /<head[^>]*>([\s\S]*?)<\/head>/i.exec(pack.html);
  const bodySource = bodyMatch ? bodyMatch[1] : "<p>Missing body, add content.</p>";
  const headSource = headMatch ? headMatch[1] : "";
  const body = sanitizeMarkupForPreview(bodySource);
  const headStyle = collectHeadStyles(headSource);
  const css = sanitizeCssForPreview(`${headStyle}\n${pack.css}`);

  return `<!doctype html>
<html>
<head>
<meta charset="UTF-8" />
<style>${css}</style>
</head>
<body>
${body}
</body>
</html>`;
}

type AppEventPhase = {
  phase: string;
  detail: string;
  storage?: Record<string, SimValue>;
  output?: string;
};

export type AppJourneyOutcome = {
  ok: boolean;
  status: number;
  requestLabel: string;
  phases: AppEventPhase[];
  response: Record<string, unknown>;
  finalMessage: string;
  error?: string;
};

export function runFrontendJourney(payloadJson: string): AppJourneyOutcome {
  const requestPhases: AppEventPhase[] = [
    { phase: "Frontend event", detail: "User clicked the button. A payload is prepared." },
  ];

  let payload: { userId?: string; action?: string; amount?: number };
  try {
    payload = JSON.parse(payloadJson) as { userId?: string; action?: string; amount?: number };
  } catch {
    return {
      ok: false,
      status: 400,
      requestLabel: "POST /simulate",
      phases: requestPhases.concat([
        { phase: "Request validation", detail: "Invalid JSON. Check commas, quotes, and brackets." },
      ]),
      response: { message: "Invalid JSON" },
      finalMessage: "Fix JSON before sending.",
      error: "Invalid JSON.",
    };
  }

  requestPhases.push({
    phase: "Request",
    detail: `POST /simulate with userId=${String(payload.userId ?? "undefined")}`,
    storage: payload,
  });

  if (!payload.userId || typeof payload.userId !== "string" || payload.userId.length < 2) {
    return {
      ok: false,
      status: 422,
      requestLabel: "POST /simulate",
      phases: requestPhases.concat([{ phase: "Backend validation", detail: "Missing or short userId." }]),
      response: { status: 422, reason: "Invalid userId" },
      finalMessage: "Backend rejected the request because userId is required.",
      error: "Invalid userId.",
    };
  }

  if (payload.amount === undefined || !Number.isFinite(payload.amount)) {
    return {
      ok: false,
      status: 422,
      requestLabel: "POST /simulate",
      phases: requestPhases.concat([{ phase: "Backend validation", detail: "Amount must be a number." }]),
      response: { status: 422, reason: "Invalid amount" },
      finalMessage: "Backend rejected the request because amount is required and must be numeric.",
      error: "Invalid amount.",
    };
  }

  const acceptedAmount = Number(payload.amount);
  const storedBalance = 100;
  const updated = storedBalance + acceptedAmount;

  return {
    ok: true,
    status: 200,
    requestLabel: "POST /simulate",
    phases: requestPhases.concat([
      { phase: "Backend validation", detail: "Request format validated." },
      {
        phase: "DB read",
        detail: "Mock database load completed",
        storage: { balance: storedBalance, userId: payload.userId },
      },
      {
        phase: "DB write",
        detail: `Balance updated: ${storedBalance} + ${acceptedAmount} = ${updated}`,
        storage: { balance: updated, userId: payload.userId },
      },
      {
        phase: "Frontend state update",
        detail: `Screen state updates to ${updated}`,
        output: String(updated),
      },
    ]),
    response: {
      status: 200,
      message: "Balance updated",
      userId: payload.userId,
      balance: updated,
    },
    finalMessage: `Saved new balance ${updated}`,
  };
}

export type PackageLockSimulation = {
  ok: boolean;
  output: string;
  manifest: Record<string, string>;
  lock: string;
  trace: SimTraceStep[];
  friendlyMessage: string;
  message?: string;
};

const SAFE_PACKAGE_FEED: Record<string, string[]> = {
  lodash: ["4.17.21", "4.17.20"],
  react: ["18.2.0", "18.1.0"],
  "react-dom": ["18.2.0", "18.1.0"],
  "date-fns": ["3.6.0", "2.29.1"],
  zod: ["3.24.0", "3.23.8"],
  chalk: ["5.3.0", "5.2.0"],
};

export function simulatePackageCommand(
  manifest: Record<string, string>,
  command: string,
): PackageLockSimulation {
  const trimmed = command.trim();
  const trace: SimTraceStep[] = [];

  if (!trimmed) {
    return {
      ok: false,
      output: "",
      manifest,
      lock: JSON.stringify({ version: 3, packages: {} }, null, 2),
      trace,
      friendlyMessage: "Type a command in the strict format first.",
      message: "Missing command",
    };
  }

  if (!/^(npm\s+install\s+|yarn\s+add\s+|pnpm\s+add\s+).+$/i.test(trimmed)) {
    return {
      ok: false,
      output: "",
      manifest,
      lock: JSON.stringify({ version: 3, packages: manifest }, null, 2),
      trace,
      friendlyMessage:
        "Allowed syntax is `npm install <package>@<version>` or `npm install <package>`.",
      message: "Unsupported command.",
    };
  }

  const match = /^(?:npm\s+install\s+|yarn\s+add\s+|pnpm\s+add\s+)([a-zA-Z0-9._-]+)(?:@([0-9]+\.[0-9]+\.[0-9]+))?\s*$/i.exec(
    trimmed,
  );

  if (!match) {
    return {
      ok: false,
      output: "",
      manifest,
      lock: JSON.stringify({ version: 3, packages: manifest }, null, 2),
      trace,
      friendlyMessage:
        "Command format is strict: package name, optional @x.y.z version, no flags or urls.",
      message: "Unrecognized package install pattern.",
    };
  }

  const packageName = match[1].toLowerCase();
  const requestedVersion = match[2] || SAFE_PACKAGE_FEED[packageName]?.[0];

  if (!requestedVersion) {
    return {
      ok: false,
      output: "",
      manifest,
      lock: JSON.stringify({ version: 3, packages: manifest }, null, 2),
      trace,
      friendlyMessage:
        "This package is not in the simulator catalog. Use a known package name such as lodash, react, react-dom, date-fns, zod, or chalk.",
      message: "Unknown package name.",
    };
  }

  const knownVersions = SAFE_PACKAGE_FEED[packageName];

  if (!knownVersions || !knownVersions.includes(requestedVersion)) {
    return {
      ok: false,
      output: "",
      manifest,
      lock: JSON.stringify({ version: 3, packages: manifest }, null, 2),
      trace,
      friendlyMessage:
        "This exact version is not in the lock catalog. Choose one of the listed versions for this simulator.",
      message: "Unknown version.",
    };
  }

  const nextManifest = { ...manifest, [packageName]: `^${requestedVersion}` };

  trace.push({
    phase: "Command parse",
    detail: `Command parsed for ${packageName}@${requestedVersion}`,
    memory: { package: packageName, version: requestedVersion },
  });
  trace.push({
    phase: "Resolver",
    detail: "Dependency graph generated from local catalog.",
    memory: { dependencies: Object.keys(nextManifest).length },
  });
  trace.push({
    phase: "Lock update",
    detail: `Lock file pinned ${packageName} to ${requestedVersion}`,
    memory: { package: packageName, locked: requestedVersion },
  });

  return {
    ok: true,
    output: `${packageName}@${requestedVersion} added.`,
    manifest: nextManifest,
    lock: JSON.stringify({
      name: "learning-lab",
      version: "1.0.0",
      lockfileVersion: 3,
      packages: nextManifest,
    }, null, 2),
    trace,
    friendlyMessage: "Lockfile updated in your simulator memory.",
  };
}

export function compareEnvironmentDependencies(local: Record<string, string>, prod: Record<string, string>) {
  const mismatches: Array<{ packageName: string; local: string; prod: string }> = [];
  const all = new Set<string>([...Object.keys(local), ...Object.keys(prod)]);

  for (const packageName of all) {
    const localVersion = local[packageName];
    const prodVersion = prod[packageName];
    if (localVersion !== prodVersion) {
      mismatches.push({ packageName, local: localVersion ?? "missing", prod: prodVersion ?? "missing" });
    }
  }

  return {
    matches: mismatches.length === 0,
    mismatches,
  };
}
