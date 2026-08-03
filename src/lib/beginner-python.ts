export type BeginnerPythonResult =
  | {
      ok: true;
      output: string;
    }
  | {
      ok: false;
      error: string;
      friendlyMessage: string;
    };

type PythonValue =
  | { type: "string"; value: string }
  | { type: "number"; value: number };

type Variables = Map<string, PythonValue>;

const pythonKeywords = new Set([
  "False",
  "None",
  "True",
  "and",
  "as",
  "assert",
  "async",
  "await",
  "break",
  "class",
  "continue",
  "def",
  "del",
  "elif",
  "else",
  "except",
  "finally",
  "for",
  "from",
  "global",
  "if",
  "import",
  "in",
  "is",
  "lambda",
  "nonlocal",
  "not",
  "or",
  "pass",
  "raise",
  "return",
  "try",
  "while",
  "with",
  "yield",
]);

class BeginnerPythonError extends Error {
  readonly friendlyMessage: string;

  constructor(message: string, friendlyMessage: string) {
    super(message);
    this.friendlyMessage = friendlyMessage;
  }
}

function syntaxError(line: number, message: string, friendlyMessage: string): never {
  throw new BeginnerPythonError(
    `SyntaxError on line ${line}: ${message}`,
    friendlyMessage,
  );
}

function decodeString(value: string) {
  return value.replace(/\\([\\'"ntr])/g, (_match, escaped: string) => {
    const replacements: Record<string, string> = {
      "\\": "\\",
      "'": "'",
      '"': '"',
      n: "\n",
      r: "\r",
      t: "\t",
    };

    return replacements[escaped] ?? escaped;
  });
}

function splitOutsideStrings(value: string, separator: "+" | ",", line: number) {
  const parts: string[] = [];
  let current = "";
  let quote: "'" | '"' | null = null;
  let escaped = false;

  for (const character of value) {
    if (escaped) {
      current += character;
      escaped = false;
      continue;
    }

    if (character === "\\" && quote) {
      current += character;
      escaped = true;
      continue;
    }

    if (character === "'" || character === '"') {
      if (quote === character) {
        quote = null;
      } else if (!quote) {
        quote = character;
      }
      current += character;
      continue;
    }

    if (character === separator && !quote) {
      parts.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  if (quote) {
    syntaxError(
      line,
      "unterminated string literal",
      "One quotation mark is missing. Text needs a matching quote at both ends.",
    );
  }

  parts.push(current.trim());

  if (separator === "," && parts.length > 1 && parts.at(-1) === "") {
    parts.pop();
  }

  return parts;
}

function stripInlineComment(value: string) {
  let quote: "'" | '"' | null = null;
  let escaped = false;

  for (let index = 0; index < value.length; index += 1) {
    const character = value[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === "\\" && quote) {
      escaped = true;
      continue;
    }

    if (character === "'" || character === '"') {
      if (quote === character) {
        quote = null;
      } else if (!quote) {
        quote = character;
      }
      continue;
    }

    if (character === "#" && !quote) {
      return value.slice(0, index).trim();
    }
  }

  return value.trim();
}

function evaluateAtom(atom: string, variables: Variables, line: number): PythonValue {
  const trimmed = atom.trim();

  if (!trimmed) {
    syntaxError(
      line,
      "expected a value",
      "Python expected a value here. Check for an extra comma or plus sign.",
    );
  }

  const first = trimmed[0];
  const last = trimmed.at(-1);

  if (first === "'" || first === '"') {
    if (last !== first || trimmed.length < 2) {
      syntaxError(
        line,
        "unterminated string literal",
        "One quotation mark is missing. Text needs a matching quote at both ends.",
      );
    }

    return { type: "string", value: decodeString(trimmed.slice(1, -1)) };
  }

  if (/^-?\d+(?:\.\d+)?$/.test(trimmed)) {
    return { type: "number", value: Number(trimmed) };
  }

  if (/^[A-Za-z_]\w*$/.test(trimmed)) {
    const variable = variables.get(trimmed);
    if (!variable) {
      throw new BeginnerPythonError(
        `NameError on line ${line}: name '${trimmed}' is not defined`,
        `Python does not know the name “${trimmed}” yet. Define it first or put quotation marks around text.`,
      );
    }

    return variable;
  }

  syntaxError(
    line,
    `cannot understand '${trimmed}'`,
    "Keep this first exercise simple: use quoted text, a number, or a variable name.",
  );
}

function evaluateExpression(expression: string, variables: Variables, line: number) {
  const atoms = splitOutsideStrings(expression, "+", line);
  let result = evaluateAtom(atoms[0], variables, line);

  for (const atom of atoms.slice(1)) {
    const next = evaluateAtom(atom, variables, line);

    if (result.type !== next.type) {
      throw new BeginnerPythonError(
        `TypeError on line ${line}: can only join values of the same type with +`,
        "Python cannot join text and a number directly. For now, join text with text.",
      );
    }

    result =
      result.type === "string" && next.type === "string"
        ? { type: "string", value: result.value + next.value }
        : {
            type: "number",
            value: Number(result.value) + Number(next.value),
          };
  }

  return result;
}

function renderValue(value: PythonValue) {
  return String(value.value);
}

/**
 * Runs a deliberately tiny, deterministic subset of Python for early lessons.
 * It never evaluates JavaScript, starts a process, accesses files, or uses the network.
 */
export function runBeginnerPython(source: string): BeginnerPythonResult {
  const variables: Variables = new Map();
  const output: string[] = [];
  const lines = source.replace(/\r\n?/g, "\n").split("\n");

  try {
    if (!source.trim()) {
      syntaxError(
        1,
        "no instruction was entered",
        "Type one Python instruction in the editor, then run it again.",
      );
    }

    lines.forEach((rawLine, index) => {
      const lineNumber = index + 1;
      const line = stripInlineComment(rawLine);

      if (!line || line.startsWith("#")) {
        return;
      }

      if (/^Print\s*\(/.test(line)) {
        throw new BeginnerPythonError(
          `NameError on line ${lineNumber}: name 'Print' is not defined`,
          "Python cares about uppercase and lowercase letters. Its print function begins with a lowercase p.",
        );
      }

      const assignment = line.match(/^([A-Za-z_]\w*)\s*=\s*(.+)$/);
      if (assignment) {
        if (pythonKeywords.has(assignment[1])) {
          syntaxError(
            lineNumber,
            `cannot assign to Python keyword '${assignment[1]}'`,
            `“${assignment[1]}” is a word Python already uses. Choose a different variable name.`,
          );
        }

        variables.set(
          assignment[1],
          evaluateExpression(assignment[2], variables, lineNumber),
        );
        return;
      }

      if (/^print\b/.test(line)) {
        if (!/^print\s*\(/.test(line)) {
          syntaxError(
            lineNumber,
            "missing parentheses in call to 'print'",
            "Put the value you want to display inside parentheses after print.",
          );
        }

        if (!line.endsWith(")")) {
          syntaxError(
            lineNumber,
            "'(' was never closed",
            "The opening parenthesis after print needs a closing parenthesis at the end.",
          );
        }

        const shadowedPrint = variables.get("print");
        if (shadowedPrint) {
          throw new BeginnerPythonError(
            `TypeError on line ${lineNumber}: '${shadowedPrint.type}' object is not callable`,
            "The name print was replaced by a variable earlier. Rename that variable so Python can use its print function again.",
          );
        }

        const expression = line.replace(/^print\s*\(/, "").slice(0, -1).trim();
        if (!expression) {
          output.push("");
          return;
        }

        const values = splitOutsideStrings(expression, ",", lineNumber).map((part) =>
          evaluateExpression(part, variables, lineNumber),
        );
        output.push(values.map(renderValue).join(" "));
        return;
      }

      if (/^[A-Za-z_]\w*\s*\(/.test(line)) {
        const name = line.match(/^([A-Za-z_]\w*)/)?.[1] ?? "function";
        throw new BeginnerPythonError(
          `NameError on line ${lineNumber}: name '${name}' is not defined`,
          `This small lesson does not know a function named “${name}”. Check the spelling and letter case.`,
        );
      }

      syntaxError(
        lineNumber,
        "unsupported instruction in this beginner runner",
        "This lesson runner currently understands text variables and print(...). Try one of those patterns.",
      );
    });

    return { ok: true, output: output.join("\n") };
  } catch (error) {
    if (error instanceof BeginnerPythonError) {
      return {
        ok: false,
        error: error.message,
        friendlyMessage: error.friendlyMessage,
      };
    }

    return {
      ok: false,
      error: "PracticeRunnerError: the instruction could not be checked",
      friendlyMessage: "Something unexpected happened in the lesson runner. Reset the code and try again.",
    };
  }
}
