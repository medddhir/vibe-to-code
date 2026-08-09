import type { ReactNode } from "react";

type TraceEntryValuePrimitive = string | number | boolean | null | unknown;
type StructuredValue = {
  type: string;
  value: string | number | boolean | null;
};

type TraceEntryValue = TraceEntryValuePrimitive | StructuredValue | Record<string, unknown> | unknown[];

export type ExecutionTraceEntry = {
  phase: string;
  detail: string;
  memory?: Record<string, TraceEntryValue>;
  output?: string;
};

export type ExecutionTraceData = {
  label: string;
  entries: ExecutionTraceEntry[];
};

function formatValue(value: TraceEntryValue): string {
  if (value === null) {
    return "null";
  }

  if (typeof value === "boolean") {
    return value ? "True" : "False";
  }

  if (typeof value === "object" && value !== null && "type" in value && "value" in value) {
    const structured = value as StructuredValue;
    return `${structured.type}: ${formatValue(structured.value)}`;
  }

  if (typeof value === "object" && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
}

function MemoryGrid({ memory }: { memory?: Record<string, TraceEntryValue> }) {
  if (!memory) {
    return null;
  }

  const keys = Object.keys(memory);

  if (keys.length === 0) {
    return <small className="trace-memory-empty">No variables yet.</small>;
  }

  return (
    <div className="trace-memory" role="group" aria-label="Current memory snapshot">
      {keys.map((name) => (
        <code key={name}>
          {name}: {formatValue(memory[name])}
        </code>
      ))}
    </div>
  );
}

function TraceSummary({ title, total }: { title: string; total: number }) {
  return (
    <div className="trace-summary">
      <span aria-hidden="true">▶</span>
      <strong>{title}</strong>
      <small>{total} action{total === 1 ? "" : "s"}</small>
    </div>
  );
}

export function ExecutionTrace({ label, entries }: ExecutionTraceData) {
  const hasEntries = entries.length > 0;

  return (
    <section className="execution-trace" aria-live="polite">
      <TraceSummary title={label} total={entries.length} />
      {!hasEntries ? (
        <p className="trace-empty">Run your input to see live steps.</p>
      ) : (
        <ol className="trace-list">
          {entries.map((entry, index) => {
            const output = entry.output;
            const outputNode: ReactNode = output ? <code>{output}</code> : null;

            return (
              <li key={`${entry.phase}-${index}`}>
                <div>
                  <strong>
                    {index + 1}. {entry.phase}
                  </strong>
                  <p>{entry.detail}</p>
                  {entry.memory ? <MemoryGrid memory={entry.memory} /> : null}
                  {outputNode ? <div className="trace-output">Output: {outputNode}</div> : null}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
