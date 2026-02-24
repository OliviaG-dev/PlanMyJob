const STORAGE_KEY_PREFIX = "planmyjob_weekly_goals";

export type WeeklyGoals = {
  candidatures: number;
  candidaturesMois: number;
  taches: number;
};

const DEFAULTS: WeeklyGoals = {
  candidatures: 5,
  candidaturesMois: 20,
  taches: 10,
};

function storageKey(userId: string | undefined): string {
  return userId ? `${STORAGE_KEY_PREFIX}_${userId}` : STORAGE_KEY_PREFIX;
}

export function getWeeklyGoals(userId: string | undefined): WeeklyGoals {
  try {
    const key = storageKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw) as Partial<WeeklyGoals>;
    return {
      candidatures: typeof parsed.candidatures === "number" && parsed.candidatures >= 0 ? parsed.candidatures : DEFAULTS.candidatures,
      candidaturesMois: typeof parsed.candidaturesMois === "number" && parsed.candidaturesMois >= 0 ? parsed.candidaturesMois : DEFAULTS.candidaturesMois,
      taches: typeof parsed.taches === "number" && parsed.taches >= 0 ? parsed.taches : DEFAULTS.taches,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function setWeeklyGoals(userId: string | undefined, goals: Partial<WeeklyGoals>): WeeklyGoals {
  const current = getWeeklyGoals(userId);
  const next: WeeklyGoals = {
    candidatures: typeof goals.candidatures === "number" && goals.candidatures >= 0 ? goals.candidatures : current.candidatures,
    candidaturesMois: typeof goals.candidaturesMois === "number" && goals.candidaturesMois >= 0 ? goals.candidaturesMois : current.candidaturesMois,
    taches: typeof goals.taches === "number" && goals.taches >= 0 ? goals.taches : current.taches,
  };
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(next));
  } catch {
    // ignore
  }
  return next;
}
