/** Styles partagés avec la page OutilsPostulations (importés par le parent). */
const CONFETTI_PIECES = [
  { dx: "-8px", dy: "-10px", color: "primary", rotate: "45deg", size: 3 },
  { dx: "18px", dy: "-14px", color: "primary-soft", rotate: "-30deg", size: 4 },
  { dx: "-6px", dy: "8px", color: "primary-pale", rotate: "120deg", size: 2 },
  { dx: "14px", dy: "12px", color: "muted", rotate: "-80deg", size: 4 },
  { dx: "-20px", dy: "-8px", color: "primary", rotate: "200deg", size: 3 },
  { dx: "7px", dy: "16px", color: "primary-soft", rotate: "-150deg", size: 2 },
  { dx: "0px", dy: "-22px", color: "primary-pale", rotate: "15deg", size: 4 },
  { dx: "-12px", dy: "6px", color: "primary", rotate: "90deg", size: 3 },
  { dx: "16px", dy: "-16px", color: "muted", rotate: "-60deg", size: 2 },
];

export type OutilsProgressWrapProps = {
  value: number;
  max?: number;
  label: string;
  ariaLabel?: string;
};

export function OutilsProgressWrap({
  value,
  max = 10,
  label,
  ariaLabel,
}: OutilsProgressWrapProps) {
  const safeValue = Math.min(Math.max(0, value), max);
  const a11yLabel =
    ariaLabel ?? `${label} (${safeValue} sur ${max})`;

  return (
    <div
      className="outils-postulations__cv-progress-wrap"
      role="progressbar"
      aria-valuenow={safeValue}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={a11yLabel}
    >
      <div className="outils-postulations__cv-progress-inner">
        <div className="outils-postulations__cv-progress-header-row">
          <span className="outils-postulations__cv-progress-label">
            {label}
          </span>
          <div className="outils-postulations__cv-progress-badge">
            <span className="outils-postulations__cv-progress-number">
              {safeValue}
            </span>
            <span className="outils-postulations__cv-progress-max">
              /{max}
            </span>
          </div>
        </div>
        <div className="outils-postulations__cv-progress-segments">
          {Array.from({ length: max }, (_, i) => (
            <span
              key={i}
              className={`outils-postulations__cv-progress-segment ${i < safeValue ? "outils-postulations__cv-progress-segment--filled" : ""}`}
            />
          ))}
          <span className="outils-postulations__cv-progress-stars-wrap">
            {CONFETTI_PIECES.map((p, i) => (
              <span
                key={i}
                className={`outils-postulations__cv-progress-confetti-piece outils-postulations__cv-progress-confetti-piece--${p.color}`}
                style={
                  {
                    "--confetti-dx": p.dx,
                    "--confetti-dy": p.dy,
                    "--confetti-rotate": p.rotate,
                    "--confetti-size": `${p.size}px`,
                    "--confetti-delay": `${i * 0.02}s`,
                  } as React.CSSProperties
                }
                aria-hidden
              />
            ))}
            <img
              src="/icons/stars.png"
              alt=""
              className="outils-postulations__cv-progress-stars"
              aria-hidden
            />
          </span>
        </div>
      </div>
    </div>
  );
}
