export function LearningStep({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="learning-step">
      <span className="step-number">{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{children}</p>
      </div>
    </article>
  );
}
