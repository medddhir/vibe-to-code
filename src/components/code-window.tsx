export function CodeWindow({
  title,
  code,
  output,
}: {
  title: string;
  code: string;
  output?: string;
}) {
  return (
    <figure className="code-window">
      <figcaption>
        <span className="code-dots" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        {title}
      </figcaption>
      <pre>
        <code>{code}</code>
      </pre>
      {output ? (
        <div className="code-output">
          <span>Output</span>
          <code>{output}</code>
        </div>
      ) : null}
    </figure>
  );
}
