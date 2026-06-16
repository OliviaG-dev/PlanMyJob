import { useEffect, useMemo, useState } from "react";
import { deleteTache, fetchTaches, insertTache, updateTache } from "../lib/taches";
import type { PrioriteTache, Tache } from "../types/tache";

type UseWeeklyTasksInput = {
  userId: string | undefined;
  semaineDebuts: string[];
};

export function useWeeklyTasks({ userId, semaineDebuts }: UseWeeklyTasksInput) {
  const [taches, setTaches] = useState<Tache[]>([]);
  const [loading, setLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => {
        setTaches([]);
        setLoading(false);
      });
      return () => {};
    }

    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    fetchTaches(userId, semaineDebuts)
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
  }, [userId, semaineDebuts]);

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
    priorite: PrioriteTache,
  ) => {
    if (!userId) return;
    const tache = await insertTache(userId, { semaineDebut, titre, priorite });
    setTaches((prev) => [...prev, tache]);
  };

  const handleToggle = async (tache: Tache) => {
    if (!userId) return;
    const updated = await updateTache(userId, tache.id, {
      terminee: !tache.terminee,
    });
    setTaches((prev) => prev.map((item) => (item.id === tache.id ? updated : item)));
  };

  const handleDelete = async (tache: Tache) => {
    if (!userId) return;
    await deleteTache(userId, tache.id);
    setTaches((prev) => prev.filter((item) => item.id !== tache.id));
  };

  return {
    loading,
    tachesByWeek,
    handleAdd,
    handleToggle,
    handleDelete,
  };
}
