export type SavedSourceResult = {
  ok: boolean;
  output: string;
  error?: string;
};

export function runSavedPrintSource(source: string): SavedSourceResult {
  const normalized = source.replace(/\r\n?/g, "\n").trim();

  if (!normalized) {
    return { ok: false, output: "", error: "The saved file is empty." };
  }

  if (normalized.length > 500) {
    return {
      ok: false,
      output: "",
      error: "This learning file is limited to 500 characters.",
    };
  }

  const lines = normalized
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  if (lines.length !== 1) {
    return {
      ok: false,
      output: "",
      error: "Use one print instruction in this checkpoint.",
    };
  }

  const match = /^print\(\s*(["'])([^"'\\\n]{1,120})\1\s*\)$/.exec(lines[0]);

  if (!match) {
    return {
      ok: false,
      output: "",
      error: "Use print, round brackets, and one quoted message.",
    };
  }

  return { ok: true, output: match[2] };
}

export type SystemLayer = "hardware" | "operating-system" | "application" | "website";

export const SYSTEM_STACK_ITEMS: Array<{
  id: string;
  label: string;
  layer: SystemLayer;
  explanation: string;
}> = [
  {
    id: "keyboard",
    label: "Keyboard",
    layer: "hardware",
    explanation: "A keyboard is a physical device you can touch.",
  },
  {
    id: "windows",
    label: "Windows 11",
    layer: "operating-system",
    explanation: "Windows manages the computer and provides a platform for apps.",
  },
  {
    id: "chrome",
    label: "Google Chrome",
    layer: "application",
    explanation: "Chrome is an installed application that can open websites.",
  },
  {
    id: "vibe-to-code",
    label: "Vibe to Code lesson",
    layer: "website",
    explanation: "The lesson is web content displayed inside the browser app.",
  },
];

export function checkSystemLayer(itemId: string, layer: SystemLayer) {
  const item = SYSTEM_STACK_ITEMS.find((candidate) => candidate.id === itemId);

  if (!item) {
    return { ok: false, message: "That learning item does not exist." };
  }

  return {
    ok: item.layer === layer,
    message:
      item.layer === layer
        ? item.explanation
        : `${item.label} belongs to the ${item.layer.replace("-", " ")} layer.`,
  };
}

export type WorkspaceEntry = {
  name: string;
  type: "file" | "folder";
  parent: string;
};

export type WorkspaceOperationResult = {
  ok: boolean;
  entries: WorkspaceEntry[];
  message: string;
};

function isSafeWorkspaceName(name: string) {
  return (
    name.length > 0 &&
    name.length <= 64 &&
    name !== "." &&
    name !== ".." &&
    !/[\\/\0<>:"|?*]/.test(name)
  );
}

export function createWorkspaceItem(
  entries: WorkspaceEntry[],
  parent: string,
  type: WorkspaceEntry["type"],
  rawName: string,
): WorkspaceOperationResult {
  const name = rawName.trim();

  if (!isSafeWorkspaceName(name)) {
    return {
      ok: false,
      entries,
      message: "Use a short name without slashes or special file-system characters.",
    };
  }

  if (entries.some((entry) => entry.parent === parent && entry.name === name)) {
    return { ok: false, entries, message: `${name} already exists here.` };
  }

  const nextEntries = [...entries, { name, type, parent }];
  return {
    ok: true,
    entries: nextEntries,
    message: `${type === "folder" ? "Folder" : "File"} created: ${name}`,
  };
}

function normalizePathParts(parts: string[]) {
  const normalized: string[] = [];

  for (const part of parts) {
    if (!part || part === ".") {
      continue;
    }

    if (part === "..") {
      normalized.pop();
      continue;
    }

    normalized.push(part);
  }

  return normalized;
}

export function resolveLearningPath(currentFolder: string, requestedPath: string) {
  const trimmed = requestedPath.trim().replace(/\\/g, "/");

  if (!trimmed || trimmed.length > 180 || /[\0<>:"|?*]/.test(trimmed)) {
    return { ok: false, resolvedPath: "", message: "Enter a safe file path." };
  }

  const baseParts = trimmed.startsWith("/")
    ? []
    : currentFolder.split("/").filter(Boolean);
  const requestedParts = trimmed.split("/");
  const resolvedParts = normalizePathParts([...baseParts, ...requestedParts]);
  const resolvedPath = `/${resolvedParts.join("/")}`;

  if (resolvedPath !== "/project" && !resolvedPath.startsWith("/project/")) {
    return {
      ok: false,
      resolvedPath,
      message: "This lesson keeps navigation inside /project.",
    };
  }

  return { ok: true, resolvedPath, message: `Resolved to ${resolvedPath}` };
}

export type TerminalState = {
  cwd: string;
  directories: string[];
};

export type TerminalCommandResult = {
  ok: boolean;
  state: TerminalState;
  output: string;
  command: string;
};

function childPath(cwd: string, name: string) {
  return `${cwd === "/" ? "" : cwd}/${name}`;
}

function parentPath(cwd: string) {
  const parts = cwd.split("/").filter(Boolean);
  parts.pop();
  return parts.length ? `/${parts.join("/")}` : "/";
}

export function runTerminalCommand(
  state: TerminalState,
  rawCommand: string,
): TerminalCommandResult {
  const command = rawCommand.trim().replace(/\s+/g, " ");

  if (!command) {
    return { ok: false, state, output: "Type a command first.", command };
  }

  if (command.length > 80 || /[;&|`$<>\0]/.test(command)) {
    return {
      ok: false,
      state,
      output: "That command is outside this safe navigation lesson.",
      command,
    };
  }

  if (command === "pwd") {
    return { ok: true, state, output: state.cwd, command };
  }

  if (command === "ls") {
    const prefix = state.cwd === "/" ? "/" : `${state.cwd}/`;
    const children = state.directories
      .filter((directory) => directory.startsWith(prefix))
      .map((directory) => directory.slice(prefix.length))
      .filter((directory) => directory && !directory.includes("/"))
      .sort();

    return {
      ok: true,
      state,
      output: children.length ? children.join("  ") : "(empty folder)",
      command,
    };
  }

  if (command === "cd ..") {
    const nextState = { ...state, cwd: parentPath(state.cwd) };
    return { ok: true, state: nextState, output: "", command };
  }

  const mkdirMatch = /^mkdir ([A-Za-z0-9][A-Za-z0-9_-]{0,31})$/.exec(command);
  if (mkdirMatch) {
    const path = childPath(state.cwd, mkdirMatch[1]);

    if (state.directories.includes(path)) {
      return { ok: false, state, output: `mkdir: ${mkdirMatch[1]} already exists`, command };
    }

    return {
      ok: true,
      state: { ...state, directories: [...state.directories, path] },
      output: "",
      command,
    };
  }

  const cdMatch = /^cd ([A-Za-z0-9][A-Za-z0-9_-]{0,31})$/.exec(command);
  if (cdMatch) {
    const path = childPath(state.cwd, cdMatch[1]);

    if (!state.directories.includes(path)) {
      return {
        ok: false,
        state,
        output: `cd: ${cdMatch[1]}: No such folder`,
        command,
      };
    }

    return { ok: true, state: { ...state, cwd: path }, output: "", command };
  }

  return {
    ok: false,
    state,
    output: `Command not available here: ${command}`,
    command,
  };
}

export function inspectWorkbenchDocument(source: string, expectedHeading: string) {
  const headingMatch = /<h1>\s*([^<>]{1,100})\s*<\/h1>/i.exec(source);
  const problems: string[] = [];

  if (!headingMatch) {
    problems.push("Add one complete <h1>...</h1> heading.");
  }

  if (source.length > 2_000) {
    problems.push("Keep this learning document under 2,000 characters.");
  }

  const heading = headingMatch?.[1].trim() ?? "";
  if (heading && heading !== expectedHeading) {
    problems.push(`Change the heading to exactly: ${expectedHeading}`);
  }

  return {
    ok: problems.length === 0,
    heading,
    problems,
  };
}
