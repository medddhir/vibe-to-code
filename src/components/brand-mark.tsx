import Image from "next/image";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-mark-wrap">
      <span className="brand-symbol" aria-hidden="true">
        <Image
          className="brand-symbol-image brand-symbol-image-dark"
          src="/brand/mark-dark.png"
          width={512}
          height={463}
          alt=""
          sizes="44px"
        />
        <Image
          className="brand-symbol-image brand-symbol-image-light"
          src="/brand/mark-light.png"
          width={512}
          height={399}
          alt=""
          sizes="44px"
        />
      </span>
      {compact ? null : (
        <span className="brand-wordmark" aria-hidden="true">
          <Image
            src="/brand/wordmark-dark.png"
            width={779}
            height={72}
            alt=""
            sizes="(max-width: 420px) 130px, 156px"
          />
        </span>
      )}
      <span className="brand-accessible-name">Vibe to Code</span>
    </span>
  );
}
