import { useEffect, useState } from "react";
import {
  fetchCvRessources,
  insertCvRessource,
  deleteCvRessource,
} from "../lib/cvRessources";
import type { CvRessource, CvType, CvFormat } from "../types/cvRessource";

type AddCvInput = {
  titre: string;
  type: CvType;
  format?: CvFormat;
  url: string;
};

export function useCvResources(userId: string | undefined) {
  const [cvs, setCvs] = useState<CvRessource[]>([]);
  const [loading, setLoading] = useState(!!userId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      queueMicrotask(() => {
        setCvs([]);
        setLoading(false);
        setError(null);
      });
      return () => {};
    }

    let cancelled = false;
    queueMicrotask(() => setLoading(true));
    setError(null);

    fetchCvRessources(userId)
      .then((data) => {
        if (!cancelled) setCvs(data);
      })
      .catch((err) => {
        if (!cancelled) {
          setCvs([]);
          setError(
            err instanceof Error ? err.message : "Impossible de charger les CV"
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addCv = async (input: AddCvInput): Promise<boolean> => {
    if (!userId) return false;
    setError(null);
    try {
      const created = await insertCvRessource(userId, input);
      setCvs((prev) => [created, ...prev]);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible d'ajouter ce CV");
      return false;
    }
  };

  const removeCv = async (cvId: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);
    try {
      await deleteCvRessource(userId, cvId);
      setCvs((prev) => prev.filter((c) => c.id !== cvId));
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Impossible de supprimer ce CV"
      );
      return false;
    }
  };

  return {
    cvs,
    loading,
    error,
    addCv,
    removeCv,
  };
}
