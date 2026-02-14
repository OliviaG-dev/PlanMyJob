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
        ‹
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
        ›
      </button>
    </nav>
  );
}
