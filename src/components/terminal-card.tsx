const inspectionLines = [
  { number: "01", code: "const idea = 'invoice tracker';", state: "Intent named" },
  { number: "02", code: "const build = await ai.create(idea);", state: "Output inspected" },
  { number: "03", code: "review(build.diff);", state: "Change understood" },
  { number: "04", code: "test(build.behaviour);", state: "Behaviour proven" },
  { number: "05", code: "ship(build);", state: "Ready to own" },
];

export function TerminalCard() {
  return (
    <figure className="terminal-card inspection-bench" aria-label="Code inspection workflow from AI output to verified build">
      <figcaption className="terminal-bar">
        <span>Inspection bench</span>
        <small>VTC-FLOW / LIVE MODEL</small>
        <strong>PASS PATH</strong>
      </figcaption>
      <div className="terminal-body inspection-body">
        <div className="inspection-axis" aria-hidden="true">
          <span>Prompt</span>
          <i />
          <span>Proof</span>
        </div>
        <ol className="inspection-lines">
          {inspectionLines.map((line, index) => (
            <li key={line.code} className={index === inspectionLines.length - 1 ? "is-ready" : undefined}>
              <span className="inspection-number">{line.number}</span>
              <code>{line.code}</code>
              <span className="inspection-state"><i aria-hidden="true" />{line.state}</span>
            </li>
          ))}
        </ol>
      </div>
      <div className="terminal-note">
        <span>AI writes the first draft.</span>
        <strong>You learn to verify the result.</strong>
      </div>
    </figure>
  );
}
