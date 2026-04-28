import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { getWeeklyGoals, setWeeklyGoals } from "./userGoals";

describe("userGoals", () => {
  beforeAll(() => {
    const store = new Map<string, string>();
    const mockStorage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      clear: () => {
        store.clear();
      },
    };
    Object.defineProperty(globalThis, "localStorage", {
      value: mockStorage,
      configurable: true,
    });
  });

  beforeEach(() => {
    localStorage.clear();
  });

  it("returns defaults when no value exists", () => {
    expect(getWeeklyGoals("u1")).toEqual({
      candidatures: 5,
      candidaturesMois: 20,
      taches: 10,
    });
  });

  it("persists and reloads valid values", () => {
    setWeeklyGoals("u1", { candidatures: 8, taches: 12 });

    expect(getWeeklyGoals("u1")).toEqual({
      candidatures: 8,
      candidaturesMois: 20,
      taches: 12,
    });
  });

  it("ignores negative values", () => {
    setWeeklyGoals("u1", { candidatures: -1, candidaturesMois: 3, taches: -5 });

    expect(getWeeklyGoals("u1")).toEqual({
      candidatures: 5,
      candidaturesMois: 3,
      taches: 10,
    });
  });
});
