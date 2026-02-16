import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { fetchCandidatures } from "../../lib/candidatures";
import type { Candidature } from "../../types/candidature";
import "./Planning.css";

const DAYS_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

const EVENT_LABELS: Record<string, string> = {
  nouvelle: "Candidature",
  cv_envoye: "CV envoyé",
  entretien_rh: "Entretien RH",
  entretien_technique: "Entretien technique",
  attente_reponse: "Attente de réponse",
  refus: "Refus",
};

type PlanningEvent = {
  type:
    | "nouvelle"
    | "cv_envoye"
    | "entretien_rh"
    | "entretien_technique"
    | "attente_reponse"
    | "refus";
  label: string;
  entreprise: string;
  poste: string;
  candidatureId: string;
};

function countByType(
  events: PlanningEvent[],
): { type: string; label: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const e of events) {
    counts.set(e.type, (counts.get(e.type) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([type, count]) => ({
      type,
      label: EVENT_LABELS[type] ?? type,
      count,
    }))
    .sort((a, b) => (a.label < b.label ? -1 : 1));
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function buildEventsMap(
  candidatures: Candidature[],
): Map<string, PlanningEvent[]> {
  const map = new Map<string, PlanningEvent[]>();
  for (const c of candidatures) {
    // Nouvelle candidature : dateCandidature ou createdAt
    const dateCandidature = c.dateCandidature ?? c.createdAt;
    if (dateCandidature) {
      const key = toDateKey(dateCandidature);
      const list = map.get(key) ?? [];
      list.push({
        type: "nouvelle",
        label: "Nouvelle candidature",
        entreprise: c.entreprise,
        poste: c.poste,
        candidatureId: c.id,
      });
      map.set(key, list);
    }
    // CV envoyé (si différent de la date candidature)
    if (c.cvEnvoyeAt) {
      const key = toDateKey(c.cvEnvoyeAt);
      if (!dateCandidature || key !== toDateKey(dateCandidature)) {
        const list = map.get(key) ?? [];
        list.push({
          type: "cv_envoye",
          label: "CV envoyé",
          entreprise: c.entreprise,
          poste: c.poste,
          candidatureId: c.id,
        });
        map.set(key, list);
      }
    }
    // Entretien RH
    if (c.entretienRhAt) {
      const list = map.get(toDateKey(c.entretienRhAt)) ?? [];
      list.push({
        type: "entretien_rh",
        label: "Entretien RH",
        entreprise: c.entreprise,
        poste: c.poste,
        candidatureId: c.id,
      });
      map.set(toDateKey(c.entretienRhAt), list);
    }
    // Entretien technique
    if (c.entretienTechniqueAt) {
      const list = map.get(toDateKey(c.entretienTechniqueAt)) ?? [];
      list.push({
        type: "entretien_technique",
        label: "Entretien technique",
        entreprise: c.entreprise,
        poste: c.poste,
        candidatureId: c.id,
      });
      map.set(toDateKey(c.entretienTechniqueAt), list);
    }
    // Attente de réponse
    if (c.attenteReponseAt) {
      const list = map.get(toDateKey(c.attenteReponseAt)) ?? [];
      list.push({
        type: "attente_reponse",
        label: "Attente de réponse",
        entreprise: c.entreprise,
        poste: c.poste,
        candidatureId: c.id,
      });
      map.set(toDateKey(c.attenteReponseAt), list);
    }
    // Refus
    if (c.refusAt) {
      const list = map.get(toDateKey(c.refusAt)) ?? [];
      list.push({
        type: "refus",
        label: "Refus",
        entreprise: c.entreprise,
        poste: c.poste,
        candidatureId: c.id,
      });
      map.set(toDateKey(c.refusAt), list);
    }
  }
  return map;
}

function PlanningDayModal({
  dateLabel,
  events,
  onClose,
}: {
  dateLabel: string;
  events: PlanningEvent[];
  onClose: () => void;
}) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="planning__modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="planning-modal-title"
    >
      <div className="planning__modal" onClick={(e) => e.stopPropagation()}>
        <div className="planning__modal-header">
          <h2 id="planning-modal-title" className="planning__modal-title">
            {dateLabel}
          </h2>
          <button
            type="button"
            className="planning__modal-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
        <div className="planning__modal-body">
          {events.length === 0 ? (
            <p className="planning__modal-empty">Aucun événement ce jour.</p>
          ) : (
            <ul className="planning__modal-list">
              {events.map((e, i) => (
                <li
                  key={`${e.candidatureId}-${e.type}-${i}`}
                  className={`planning__modal-event planning__modal-event--${e.type}`}
                >
                  <Link
                    to={`/candidatures/${e.candidatureId}`}
                    className="planning__modal-event-link"
                    onClick={onClose}
                  >
                    <span className="planning__modal-event-label">
                      {EVENT_LABELS[e.type] ?? e.label}
                    </span>
                    <span className="planning__modal-event-detail">
                      {e.entreprise} — {e.poste}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function PlanningDayCell({
  day,
  month,
  year,
  isPrevMonth,
  isNextMonth,
  isToday,
  events,
  onDayClick,
}: {
  day: number;
  month: number;
  year: number;
  isPrevMonth: boolean;
  isNextMonth: boolean;
  isToday: boolean;
  events: PlanningEvent[];
  onDayClick: (d: number, m: number, y: number, evts: PlanningEvent[]) => void;
}) {
  const counts = countByType(events);

  return (
    <button
      type="button"
      className={`planning__day ${isPrevMonth || isNextMonth ? "planning__day--other-month" : ""} ${isToday ? "planning__day--today" : ""}`}
      onClick={() => onDayClick(day, month, year, events)}
      aria-label={`${day} ${MONTHS[month]} — ${events.length} événement(s)`}
    >
      <span className="planning__day-num">{day}</span>
      {counts.length > 0 && (
        <ul className="planning__day-events" aria-hidden>
          {counts.map(({ type, label, count }) => (
            <li
              key={type}
              className={`planning__event planning__event--${type}`}
            >
              <span className="planning__event-label">{label}</span>
              <span className="planning__event-count">{count}</span>
            </li>
          ))}
        </ul>
      )}
    </button>
  );
}

function Planning() {
  const { user } = useAuth();
  const [viewDate, setViewDate] = useState(() => new Date());
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(!!user?.id);
  const [modalDay, setModalDay] = useState<{
    dateLabel: string;
    events: PlanningEvent[];
  } | null>(null);

  useEffect(() => {
    if (!user?.id) {
      queueMicrotask(() => {
        setCandidatures([]);
        setLoading(false);
      });
      return () => {};
    }
    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    fetchCandidatures(user.id)
      .then((data) => {
        if (!cancelled) setCandidatures(data);
      })
      .catch(() => {
        if (!cancelled) setCandidatures([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const eventsByDate = useMemo(
    () => buildEventsMap(candidatures),
    [candidatures],
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Premier jour du mois (lundi = 0)
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;

  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  const prevMonthLast = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from(
    { length: startOffset },
    (_, i) => prevMonthLast - startOffset + i + 1,
  );

  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const nextMonthDaysCount = Math.max(0, 35 - (startOffset + daysInMonth));
  const nextMonthDays = Array.from(
    { length: nextMonthDaysCount },
    (_, i) => i + 1,
  );

  const today = new Date();

  const getEventsForDay = (d: number, m: number, y: number) => {
    const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return eventsByDate.get(key) ?? [];
  };

  const handleDayClick = (
    d: number,
    m: number,
    y: number,
    evts: PlanningEvent[],
  ) => {
    setModalDay({ dateLabel: `${d} ${MONTHS[m]} ${y}`, events: evts });
  };

  const goPrev = () => setViewDate(new Date(year, month - 1));
  const goNext = () => setViewDate(new Date(year, month + 1));
  const goToday = () => setViewDate(new Date());

  return (
    <main className="planning">
      <div className="planning__header">
        <div>
          <h1>Semainier / Planning</h1>
          <p className="planning__intro">
            Entretiens, relances et deadlines de la semaine.
          </p>
        </div>
        <img
          src="/icons/callendar.png"
          alt=""
          className="planning__icon"
          aria-hidden
        />
      </div>

      {loading && (
        <p className="planning__loading">Chargement des candidatures…</p>
      )}

      <section className="planning__calendar">
        <div className="planning__calendar-nav">
          <button
            type="button"
            className="planning__nav-btn"
            onClick={goPrev}
            aria-label="Mois précédent"
          >
            ‹
          </button>
          <h2 className="planning__calendar-title">
            {MONTHS[month]} {year}
          </h2>
          <button
            type="button"
            className="planning__nav-btn"
            onClick={goNext}
            aria-label="Mois suivant"
          >
            ›
          </button>
          <button
            type="button"
            className="planning__today-btn"
            onClick={goToday}
          >
            Aujourd&apos;hui
          </button>
        </div>

        <div className="planning__calendar-wrapper">
          <div className="planning__calendar-grid">
            {DAYS_LABELS.map((label) => (
              <div key={label} className="planning__day-label">
                {label}
              </div>
            ))}
            {prevMonthDays.map((d) => {
              const prevYear = month === 0 ? year - 1 : year;
              const prevMonth = month === 0 ? 11 : month - 1;
              return (
                <PlanningDayCell
                  key={`prev-${d}`}
                  day={d}
                  month={prevMonth}
                  year={prevYear}
                  isPrevMonth
                  isNextMonth={false}
                  isToday={false}
                  events={getEventsForDay(d, prevMonth, prevYear)}
                  onDayClick={handleDayClick}
                />
              );
            })}
            {currentMonthDays.map((d) => (
              <PlanningDayCell
                key={d}
                day={d}
                month={month}
                year={year}
                isPrevMonth={false}
                isNextMonth={false}
                isToday={
                  d === today.getDate() &&
                  month === today.getMonth() &&
                  year === today.getFullYear()
                }
                events={getEventsForDay(d, month, year)}
                onDayClick={handleDayClick}
              />
            ))}
            {nextMonthDays.map((d) => {
              const nextYear = month === 11 ? year + 1 : year;
              const nextMonth = month === 11 ? 0 : month + 1;
              return (
                <PlanningDayCell
                  key={`next-${d}`}
                  day={d}
                  month={nextMonth}
                  year={nextYear}
                  isPrevMonth={false}
                  isNextMonth
                  isToday={false}
                  events={getEventsForDay(d, nextMonth, nextYear)}
                  onDayClick={handleDayClick}
                />
              );
            })}
          </div>
        </div>
      </section>

      {modalDay && (
        <PlanningDayModal
          dateLabel={modalDay.dateLabel}
          events={modalDay.events}
          onClose={() => setModalDay(null)}
        />
      )}
    </main>
  );
}

export default Planning;
