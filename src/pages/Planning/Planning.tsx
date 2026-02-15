import { useState } from "react";
import "./Planning.css";

const DAYS_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const MONTHS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

function Planning() {
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  // Premier jour du mois (lundi = 0)
  const firstDay = new Date(year, month, 1);
  const startOffset = (firstDay.getDay() + 6) % 7;

  // Dernier jour du mois
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();

  // Jours du mois précédent pour compléter la première ligne
  const prevMonthLast = new Date(year, month, 0).getDate();
  const prevMonthDays = Array.from({ length: startOffset }, (_, i) =>
    prevMonthLast - startOffset + i + 1
  );

  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const nextMonthDaysCount = Math.max(0, 35 - (startOffset + daysInMonth));
  const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => i + 1);

  const today = new Date();
  const isToday = (d: number, isPrev: boolean, isNext: boolean) =>
    !isPrev &&
    !isNext &&
    d === today.getDate() &&
    month === today.getMonth() &&
    year === today.getFullYear();

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

        <div className="planning__calendar-grid">
          {DAYS_LABELS.map((label) => (
            <div key={label} className="planning__day-label">
              {label}
            </div>
          ))}
          {prevMonthDays.map((d) => (
            <div
              key={`prev-${d}`}
              className="planning__day planning__day--other-month"
            >
              {d}
            </div>
          ))}
          {currentMonthDays.map((d) => (
            <div
              key={d}
              className={`planning__day ${isToday(d, false, false) ? "planning__day--today" : ""}`}
            >
              {d}
            </div>
          ))}
          {nextMonthDays.map((d) => (
            <div
              key={`next-${d}`}
              className="planning__day planning__day--other-month"
            >
              {d}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

export default Planning;
