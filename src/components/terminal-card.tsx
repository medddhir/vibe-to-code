const terminalLines = [
  { prefix: "$", text: "ask-ai --build my-idea", tone: "command" },
  { prefix: "✓", text: "requirements understood", tone: "success" },
  { prefix: "✓", text: "code diff reviewed", tone: "success" },
  { prefix: "✓", text: "tests passed", tone: "success" },
  { prefix: "→", text: "you know what shipped", tone: "accent" },
];

export function TerminalCard() {
  return (
    <div className="terminal-card" aria-label="A simple safe vibe coding workflow">
      <div className="terminal-bar" aria-hidden="true">
        <span />
        <span />
        <span />
        <small>vibe-to-code — learning</small>
      </div>
      <div className="terminal-body">
        {terminalLines.map((line, index) => (
          <p key={line.text} className={`terminal-line terminal-${line.tone}`}>
            <span aria-hidden="true">{line.prefix}</span>
            <span>{line.text}</span>
            {index === 0 ? <span className="terminal-cursor" aria-hidden="true" /> : null}
          </p>
        ))}
      </div>
      <div className="terminal-note">
        AI can write quickly. You learn to check carefully.
      </div>
    </div>
  );
}
