import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  fetchTaches,
  insertTache,
  updateTache,
  deleteTache,
} from "../../lib/taches";
import type { Tache, PrioriteTache } from "../../types/tache";
import "./Taches.css";

const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];

const MOIS_COURTS = [
  "jan.", "fév.", "mars", "avr.", "mai", "juin",
  "juil.", "août", "sep.", "oct.", "nov.", "déc.",
];

const PRIORITE_LABELS: Record<PrioriteTache, string> = {
  basse: "Basse",
  normale: "Normale",
  haute: "Haute",
};

const PRIORITE_ORDER: Record<PrioriteTache, number> = {
  haute: 0,
  normale: 1,
  basse: 2,
};

/** Retourne le lundi de la semaine ISO contenant la date. */
function getMondayOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  return copy;
}

/** Format YYYY-MM-DD pour la date (heure locale, pas UTC). */
function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Liste des lundis ISO des semaines qui touchent le mois (year, month). */
function getISOWeeksInMonth(year: number, month: number): Date[] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startMonday = getMondayOfWeek(first);
  const endMonday = getMondayOfWeek(last);
  const mondays: Date[] = [];
  const current = new Date(startMonday);
  while (current <= endMonday) {
    mondays.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  return mondays;
}

/** { range: "27 jan. – 2 fév.", year: " 2025" } */
function formatWeekRange(monday: Date): { range: string; year: string } {
  const end = new Date(monday);
  end.setDate(end.getDate() + 6);
  const d1 = monday.getDate();
  const m1 = MOIS_COURTS[monday.getMonth()];
  const d2 = end.getDate();
  const m2 = MOIS_COURTS[end.getMonth()];
  const y = end.getFullYear();
  if (m1 === m2) return { range: `${d1} – ${d2} ${m1}`, year: ` ${y}` };
  return { range: `${d1} ${m1} – ${d2} ${m2}`, year: ` ${y}` };
}

function isCurrentWeek(monday: Date): boolean {
  const today = new Date();
  const thisMonday = getMondayOfWeek(today);
  return toDateKey(monday) === toDateKey(thisMonday);
}

/** Semaine déjà passée (lundi avant la semaine courante). */
function isPastWeek(monday: Date): boolean {
  const today = new Date();
  const thisMonday = getMondayOfWeek(today);
  return toDateKey(monday) < toDateKey(thisMonday);
}

type TacheItemProps = {
  tache: Tache;
  onToggle: () => void;
  onDelete: () => void;
};

function TacheItem({ tache, onToggle, onDelete }: TacheItemProps) {
  return (
    <li
      className={`taches__item ${tache.terminee ? "taches__item--done" : ""} taches__item--${tache.priorite}`}
    >
      <label className="taches__item-check">
        <input
          type="checkbox"
          checked={tache.terminee}
          onChange={onToggle}
          aria-label={`Marquer « ${tache.titre} » comme ${tache.terminee ? "non terminée" : "terminée"}`}
        />
        <span className="taches__item-checkbox" aria-hidden />
      </label>
      <span className="taches__item-titre">{tache.titre}</span>
      <span
        className={`taches__item-prio taches__item-prio--${tache.priorite}`}
        title={`Priorité : ${PRIORITE_LABELS[tache.priorite]}`}
      >
        {PRIORITE_LABELS[tache.priorite]}
      </span>
      {tache.candidatureId && (
        <Link
          to={`/candidatures/${tache.candidatureId}`}
          className="taches__item-link"
          title="Voir la candidature"
        >
          →
        </Link>
      )}
      <button
        type="button"
        className="taches__item-delete"
        onClick={onDelete}
        aria-label={`Supprimer « ${tache.titre } »`}
      >
        ×
      </button>
    </li>
  );
}

type WeekBlockProps = {
  monday: Date;
  taches: Tache[];
  onAdd: (titre: string, priorite: PrioriteTache) => Promise<void>;
  onToggle: (tache: Tache) => void;
  onDelete: (tache: Tache) => void;
};

function WeekBlock({ monday, taches, onAdd, onToggle, onDelete }: WeekBlockProps) {
  const isCurrent = isCurrentWeek(monday);
  const isPast = isPastWeek(monday);
  const [isOpen, setIsOpen] = useState(isCurrent);
  const { range, year } = formatWeekRange(monday);

  const [newTitre, setNewTitre] = useState("");
  const [newPriorite, setNewPriorite] = useState<PrioriteTache>("normale");
  const [showAdd, setShowAdd] = useState(false);
  const [adding, setAdding] = useState(false);

  const sorted = useMemo(
    () =>
      [...taches].sort(
        (a, b) =>
          PRIORITE_ORDER[a.priorite] - PRIORITE_ORDER[b.priorite] ||
          a.ordre - b.ordre
      ),
    [taches]
  );

  const done = taches.filter((t) => t.terminee).length;
  const total = taches.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const titre = newTitre.trim();
    if (!titre || adding) return;
    setAdding(true);
    try {
      await onAdd(titre, newPriorite);
      setNewTitre("");
      setNewPriorite("normale");
      setShowAdd(false);
    } finally {
      setAdding(false);
    }
  };

  return (
    <section
      className={`taches__week ${isCurrent ? "taches__week--current" : ""} ${isPast ? "taches__week--past" : ""} ${isOpen ? "taches__week--open" : "taches__week--closed"}`}
    >
      <header
        className="taches__week-header"
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen((o) => !o);
          }
        }}
        aria-expanded={isOpen}
        aria-controls={`taches-week-${toDateKey(monday)}`}
        aria-label={`${range}${year}${isOpen ? ", replier" : ", déplier"}`}
      >
        <h3 className="taches__week-title">
          <span className="taches__week-chevron" aria-hidden>
            {isOpen ? "▼" : "▶"}
          </span>
          {range}
          <span className="taches__week-year">{year}</span>
        </h3>
        {isCurrent && (
          <span className="taches__week-badge" title="En cours">
            <span className="taches__week-badge-text">En cours</span>
            <span className="taches__week-badge-icon" aria-hidden>★</span>
          </span>
        )}
        <span className="taches__week-count">
          {total > 0 ? `${done}/${total}` : "—"}
        </span>
      </header>
      <div
        id={`taches-week-${toDateKey(monday)}`}
        className={`taches__week-body ${isOpen ? "taches__week-body--open" : ""}`}
      >
        <div className="taches__week-body-inner">
      <ul className="taches__list-items">
        {sorted.map((t) => (
          <TacheItem
            key={t.id}
            tache={t}
            onToggle={() => onToggle(t)}
            onDelete={() => onDelete(t)}
          />
        ))}
      </ul>
      {showAdd ? (
        <form className="taches__add-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="taches__add-input"
            value={newTitre}
            onChange={(e) => setNewTitre(e.target.value)}
            placeholder="Nouvelle tâche…"
            autoFocus
            disabled={adding}
          />
          <select
            className="taches__add-select"
            value={newPriorite}
            onChange={(e) => setNewPriorite(e.target.value as PrioriteTache)}
            disabled={adding}
            aria-label="Priorité"
          >
            {(Object.keys(PRIORITE_LABELS) as PrioriteTache[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITE_LABELS[p]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="taches__add-btn"
            disabled={!newTitre.trim() || adding}
          >
            Ajouter
          </button>
          <button
            type="button"
            className="taches__add-cancel"
            onClick={() => {
              setShowAdd(false);
              setNewTitre("");
            }}
          >
            Annuler
          </button>
        </form>
      ) : (
        <button
          type="button"
          className="taches__add-trigger"
          onClick={() => setShowAdd(true)}
        >
          + Ajouter une tâche
        </button>
      )}
        </div>
      </div>
    </section>
  );
}

function Taches() {
  const { user } = useAuth();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(!!user?.id);

  const weeks = useMemo(
    () =>
      getISOWeeksInMonth(viewDate.getFullYear(), viewDate.getMonth()),
    [viewDate]
  );

  const semaineDebuts = useMemo(
    () => weeks.map((d) => toDateKey(d)),
    [weeks]
  );

  useEffect(() => {
    if (!user?.id) {
      queueMicrotask(() => {
        setTaches([]);
        setLoading(false);
      });
      return () => {};
    }
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    fetchTaches(user.id, semaineDebuts)
      .then((data) => {
        if (!cancelled) setTaches(data);
      })
      .catch(() => {
        if (!cancelled) setTaches([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id, semaineDebuts]);

  const tachesByWeek = useMemo(() => {
    const map = new Map<string, Tache[]>();
    for (const t of taches) {
      const list = map.get(t.semaineDebut) ?? [];
      list.push(t);
      map.set(t.semaineDebut, list);
    }
    return map;
  }, [taches]);

  const handleAdd = async (
    semaineDebut: string,
    titre: string,
    priorite: PrioriteTache
  ) => {
    if (!user?.id) return;
    const t = await insertTache(user.id, { semaineDebut, titre, priorite });
    setTaches((prev) => [...prev, t]);
  };

  const handleToggle = async (tache: Tache) => {
    if (!user?.id) return;
    const updated = await updateTache(user.id, tache.id, {
      terminee: !tache.terminee,
    });
    setTaches((prev) =>
      prev.map((t) => (t.id === tache.id ? updated : t))
    );
  };

  const handleDelete = async (tache: Tache) => {
    if (!user?.id) return;
    await deleteTache(user.id, tache.id);
    setTaches((prev) => prev.filter((t) => t.id !== tache.id));
  };

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const goPrev = () => setViewDate(new Date(year, month - 1));
  const goNext = () => setViewDate(new Date(year, month + 1));
  const goThisMonth = () => setViewDate(new Date());

  return (
    <main className="taches">
      <div className="taches__header">
        <div>
          <h1>Tâches</h1>
          <p className="taches__intro">
            Todo liste par semaine. Planifiez vos actions de recherche d&apos;emploi.
          </p>
        </div>
        <img
          src="/icons/taches.png"
          alt=""
          className="taches__icon"
          aria-hidden
        />
      </div>

      <div className="taches__nav">
        <button
          type="button"
          className="taches__nav-btn"
          onClick={goPrev}
          aria-label="Mois précédent"
        >
          <svg className="taches__nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <h2 className="taches__nav-title">
          {MONTHS[month]} {year}
        </h2>
        <button
          type="button"
          className="taches__nav-btn"
          onClick={goNext}
          aria-label="Mois suivant"
        >
          <svg className="taches__nav-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </button>
        <button
          type="button"
          className="taches__today-btn"
          onClick={goThisMonth}
        >
          Ce mois
        </button>
      </div>

      {loading && (
        <p className="taches__loading">Chargement des tâches…</p>
      )}

      <div className="taches__weeks">
        {weeks.map((monday) => {
          const key = toDateKey(monday);
          const weekTaches = tachesByWeek.get(key) ?? [];
          return (
            <WeekBlock
              key={key}
              monday={monday}
              taches={weekTaches}
              onAdd={(titre, priorite) => handleAdd(key, titre, priorite)}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          );
        })}
      </div>
    </main>
  );
}

export default Taches;
