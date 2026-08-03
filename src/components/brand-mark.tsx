export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-mark-wrap">
      <span className="brand-mark" aria-hidden="true">
        <span>&lt;</span>
        <span className="brand-mark-slash">/</span>
        <span>&gt;</span>
      </span>
      {compact ? null : (
        <span className="brand-copy">
          <strong>Vibe to Code</strong>
          <small>by TurboPay</small>
        </span>
      )}
    </span>
  );
}
