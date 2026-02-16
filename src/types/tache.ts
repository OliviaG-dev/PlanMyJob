export type PrioriteTache = "basse" | "normale" | "haute";

export type Tache = {
  id: string;
  semaineDebut: string; // YYYY-MM-DD (lundi ISO)
  titre: string;
  priorite: PrioriteTache;
  terminee: boolean;
  candidatureId?: string;
  ordre: number;
  createdAt: string;
  updatedAt: string;
};
