const MOIS_COURTS = [
  "jan.",
  "fév.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sep.",
  "oct.",
  "nov.",
  "déc.",
];

export const MONTH_LABELS = [
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

/** Retourne le lundi de la semaine ISO contenant la date. */
export function getMondayOfWeek(d: Date): Date {
  const copy = new Date(d);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

/** Format YYYY-MM-DD pour la date (heure locale, pas UTC). */
export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Liste des lundis ISO des semaines qui touchent le mois (year, month 0-11). */
export function getISOWeeksInMonth(year: number, month: number): Date[] {
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

const WEEK_ORDINALS = [
  "Première",
  "Deuxième",
  "Troisième",
  "Quatrième",
  "Cinquième",
  "Sixième",
];

/** { range: "27 jan. – 2 fév.", year: " 2025" } */
export function formatWeekRange(monday: Date): { range: string; year: string } {
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

/** Libellé « Première semaine · 9 – 15 mars 2026 » (index 0-based dans le mois). */
export function formatWeekLabelInMonth(monday: Date, weekIndex: number): string {
  const { range, year } = formatWeekRange(monday);
  const ordinal =
    WEEK_ORDINALS[weekIndex] ?? `${weekIndex + 1}e`;
  return `${ordinal} semaine · ${range}${year}`;
}

export function formatMonthLabel(year: number, month: number): string {
  return `${MONTH_LABELS[month]} ${year}`;
}

export type MonthBounds = {
  start: Date;
  end: Date;
  isPartial: boolean;
  partialUntil: string;
};

/** Bornes du mois : partiel jusqu'à demain si mois en cours. */
export function getMonthBounds(
  year: number,
  month: number,
  now: Date = new Date()
): MonthBounds {
  const start = new Date(year, month, 1);
  start.setHours(0, 0, 0, 0);

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth();

  const end = isCurrentMonth
    ? new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    : new Date(year, month + 1, 1);

  const partialUntil = isCurrentMonth
    ? toDateKey(now)
    : toDateKey(new Date(year, month + 1, 0));

  return { start, end, isPartial: isCurrentMonth, partialUntil };
}

export function isDateInRange(
  iso: string | undefined,
  start: Date,
  end: Date
): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return d >= start && d < end;
}

/** Fin du mois calendaire (exclusif) — pour reconstruire l'état à la fin d'un mois passé. */
export function getEndOfMonthExclusive(year: number, month: number): Date {
  return new Date(year, month + 1, 1);
}
