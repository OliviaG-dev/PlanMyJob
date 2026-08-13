import "./Pagination.css";

export type PaginationProps = {
  /** Page courante (0-based) */
  currentPage: number;
  /** Nombre total de pages */
  totalPages: number;
  /** Callback appelé au changement de page (reçoit l’index 0-based) */
  onPageChange: (page: number) => void;
  /** Label pour l’accessibilité (ex. "Pagination Candidatures") */
  ariaLabel?: string;
};

type ChevronIconProps = {
  direction: "prev" | "next";
};

function ChevronIcon({ direction }: ChevronIconProps) {
  return (
    <svg
      className="pagination__icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {direction === "prev" ? (
        <path d="M15 6l-6 6 6 6" />
      ) : (
        <path d="M9 6l6 6-6 6" />
      )}
    </svg>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  ariaLabel = "Pagination",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav
      className="pagination"
      aria-label={ariaLabel}
    >
      <button
        type="button"
        className="pagination__btn"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Page précédente"
      >
        <ChevronIcon direction="prev" />
      </button>
      <span className="pagination__info">
        {currentPage + 1} / {totalPages}
      </span>
      <button
        type="button"
        className="pagination__btn"
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Page suivante"
      >
        <ChevronIcon direction="next" />
      </button>
    </nav>
  );
}
