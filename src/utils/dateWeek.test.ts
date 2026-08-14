import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatMonthLabel,
  formatWeekLabelInMonth,
  formatWeekRange,
  getEndOfMonthExclusive,
  getISOWeeksInMonth,
  getMondayOfWeek,
  getMonthBounds,
  isDateInRange,
  toDateKey,
} from "./dateWeek";

describe("dateWeek", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns monday for a wednesday date", () => {
    const monday = getMondayOfWeek(new Date(2026, 7, 12));
    expect(monday.getDay()).toBe(1);
    expect(toDateKey(monday)).toBe("2026-08-10");
  });

  it("formats week range within same month", () => {
    const monday = new Date(2026, 7, 10);
    expect(formatWeekRange(monday)).toEqual({
      range: "10 – 16 août",
      year: " 2026",
    });
  });

  it("formats week label with ordinal", () => {
    const monday = new Date(2026, 7, 10);
    expect(formatWeekLabelInMonth(monday, 0)).toContain("Première semaine");
  });

  it("lists ISO weeks touching a month", () => {
    const weeks = getISOWeeksInMonth(2026, 7);
    expect(weeks.length).toBeGreaterThanOrEqual(4);
    expect(weeks.every((d) => d.getDay() === 1)).toBe(true);
  });

  it("marks current month bounds as partial", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-13T12:00:00.000Z"));

    const bounds = getMonthBounds(2026, 7);
    expect(bounds.isPartial).toBe(true);
    expect(bounds.partialUntil).toBe("2026-08-13");
  });

  it("checks date inclusion in range", () => {
    const start = new Date(2026, 7, 1);
    const end = new Date(2026, 7, 15);
    expect(isDateInRange("2026-08-10", start, end)).toBe(true);
    expect(isDateInRange("2026-08-20", start, end)).toBe(false);
    expect(isDateInRange(undefined, start, end)).toBe(false);
  });

  it("formats month label and end of month", () => {
    expect(formatMonthLabel(2026, 7)).toBe("Août 2026");
    expect(getEndOfMonthExclusive(2026, 7).getMonth()).toBe(8);
  });
});
