import { useState, useRef, useEffect } from "react";
import "./Select.css";

export type SelectOption = { value: string; label: string };

export type SelectProps = {
  id: string;
  label: string;
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  /** Classe sur le conteneur (wrap) */
  wrapClassName?: string;
  /** Classe sur chaque option (ex. pour les étoiles en couleur thème) */
  optionClassName?: string;
  /** En mode contrôlé : id du select actuellement ouvert (un seul à la fois) */
  openId?: string | null;
  /** En mode contrôlé : appelé à l’ouverture/fermeture */
  onOpenChange?: (id: string | null) => void;
};

export function Select({
  id,
  label,
  value,
  options,
  onChange,
  wrapClassName,
  optionClassName,
  openId,
  onOpenChange,
}: SelectProps) {
  const isControlled = openId !== undefined && onOpenChange !== undefined;
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = isControlled ? openId === id : internalOpen;
  const setOpen = (open: boolean) => {
    if (isControlled) onOpenChange(open ? id : null);
    else setInternalOpen(open);
  };

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div
      ref={containerRef}
      className={`select__wrap ${wrapClassName ?? ""}`.trim()}
    >
      <label
        id={`${id}-label`}
        htmlFor={id}
        className="select__label"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        className="select__trigger"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-labelledby={`${id}-label`}
        onClick={() => setOpen(!isOpen)}
      >
        <span className="select__value">{selectedLabel}</span>
        <span
          className={`select__chevron ${isOpen ? "select__chevron--open" : ""}`}
          aria-hidden
        >
          ▼
        </span>
      </button>
      {isOpen && (
        <ul
          className="select__list"
          role="listbox"
          aria-labelledby={`${id}-label`}
          id={`${id}-listbox`}
        >
          {options.map((opt) => (
            <li
              key={opt.value || "__all__"}
              role="option"
              aria-selected={opt.value === value}
              className={`select__option ${opt.value === value ? "select__option--selected" : ""} ${optionClassName ?? ""}`}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
