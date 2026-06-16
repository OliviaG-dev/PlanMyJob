import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchCandidatures,
  insertCandidature,
  updateCandidature,
} from "../lib/candidatures";
import type {
  Candidature,
  Statut,
  StatutSuivi,
  Teletravail,
} from "../types/candidature";
import type { AddCandidatureFormData } from "../types/candidatureForm.types";
import {
  isCandidatureCompleted,
  isCandidatureInProgress,
  isCandidatureRefused,
} from "../utils/candidatureStatus";
import { filterCandidaturesByFilters } from "../components/CandidaturesFilters/CandidaturesFilters";

export type ListType = "en_cours" | "terminee" | "refus";

type CandidaturesLocationState = { addWithInitialData?: AddCandidatureFormData } | null;

export function useCandidaturesBoard(userId: string | undefined) {
  const navigate = useNavigate();
  const location = useLocation();

  const [modalOpen, setModalOpen] = useState(false);
  const [initialDataForAdd, setInitialDataForAdd] = useState<AddCandidatureFormData | null>(null);
  const [candidatures, setCandidatures] = useState<Candidature[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dragOverList, setDragOverList] = useState<ListType | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [filterNom, setFilterNom] = useState("");
  const [filterTeletravail, setFilterTeletravail] = useState<"" | Teletravail>("");
  const [filterVille, setFilterVille] = useState("");
  const [filterNote, setFilterNote] = useState("");
  const [listPages, setListPages] = useState<Record<ListType, number>>({
    en_cours: 0,
    terminee: 0,
    refus: 0,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [openMoveMenuId, setOpenMoveMenuId] = useState<string | null>(null);
  const moveMenuAnchorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!openMoveMenuId) return;
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (moveMenuAnchorRef.current && !moveMenuAnchorRef.current.contains(target)) {
        setOpenMoveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
    };
  }, [openMoveMenuId]);

  useEffect(() => {
    if (!userId) {
      setCandidatures([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetchCandidatures(userId)
      .then(setCandidatures)
      .catch((err) => setError(err.message ?? "Erreur au chargement"))
      .finally(() => setLoading(false));
  }, [userId]);

  useEffect(() => {
    const data = (location.state as CandidaturesLocationState)?.addWithInitialData;
    if (data) {
      setInitialDataForAdd(data);
      setModalOpen(true);
      navigate("/candidatures", { replace: true, state: {} });
    }
  }, [location.state, navigate]);

  async function handleAddCandidature(data: AddCandidatureFormData) {
    if (!userId) return;
    setSubmitting(true);
    setError(null);
    try {
      const created = await insertCandidature(userId, data);
      setCandidatures((prev) => [created, ...prev]);
      setModalOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur à l'ajout");
    } finally {
      setSubmitting(false);
    }
  }

  const filteredCandidatures = useMemo(
    () =>
      filterCandidaturesByFilters(candidatures, {
        nom: filterNom,
        teletravail: filterTeletravail,
        ville: filterVille,
        note: filterNote,
      }),
    [candidatures, filterNom, filterTeletravail, filterVille, filterNote],
  );

  const villesUniques = useMemo(
    () =>
      [...new Set(candidatures.map((c) => (c.localisation ?? "").trim()).filter(Boolean))].sort(
        (a, b) => a.localeCompare(b, "fr"),
      ),
    [candidatures],
  );

  const refus = useMemo(
    () => filteredCandidatures.filter(isCandidatureRefused),
    [filteredCandidatures],
  );
  const enCours = useMemo(
    () => filteredCandidatures.filter(isCandidatureInProgress),
    [filteredCandidatures],
  );
  const terminee = useMemo(
    () => filteredCandidatures.filter(isCandidatureCompleted),
    [filteredCandidatures],
  );

  const getPayloadForList = useCallback(
    (listType: ListType): { statut?: Statut; statutSuivi?: StatutSuivi } => {
      if (listType === "refus") return { statut: "refus", statutSuivi: "terminee" };
      if (listType === "terminee") return { statutSuivi: "terminee" };
      return { statutSuivi: "en_cours" };
    },
    [],
  );

  function handleDragStart(e: React.DragEvent, c: Candidature) {
    setDraggingId(c.id);
    e.dataTransfer.setData("application/json", JSON.stringify({ id: c.id }));
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", c.id);
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOverList(null);
  }

  function handleDragOver(e: React.DragEvent, listType: ListType) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverList(listType);
  }

  function handleDragLeave() {
    setDragOverList(null);
  }

  async function moveCandidatureToList(candidatureId: string, targetListType: ListType) {
    if (!userId) return;
    const candidature = candidatures.find((c) => c.id === candidatureId);
    if (!candidature) return;
    setOpenMoveMenuId(null);

    let payload: { statut?: Statut; statutSuivi?: StatutSuivi };
    if (targetListType === "en_cours" && candidature.statut === "refus") {
      payload = { statutSuivi: "en_cours", statut: "a_postuler" };
    } else {
      payload = getPayloadForList(targetListType);
    }
    const alreadyInList =
      targetListType === "refus"
        ? isCandidatureRefused(candidature)
        : targetListType === "terminee"
          ? isCandidatureCompleted(candidature)
          : isCandidatureInProgress(candidature);
    if (alreadyInList) return;

    const previous = [...candidatures];
    setCandidatures((prev) =>
      prev.map((c) => {
        if (c.id !== candidatureId) return c;
        return {
          ...c,
          ...(payload.statut !== undefined && { statut: payload.statut }),
          ...(payload.statutSuivi !== undefined && {
            statutSuivi: payload.statutSuivi,
          }),
        };
      }),
    );
    setError(null);
    try {
      await updateCandidature(userId, candidatureId, payload);
    } catch (err) {
      setCandidatures(previous);
      setError(err instanceof Error ? err.message : "Erreur lors du déplacement");
    }
  }

  async function handleDrop(e: React.DragEvent, listType: ListType) {
    e.preventDefault();
    setDragOverList(null);
    const raw =
      e.dataTransfer.getData("application/json") || e.dataTransfer.getData("text/plain");
    let id: string;
    try {
      const parsed = raw.startsWith("{") ? JSON.parse(raw) : { id: raw };
      id = parsed.id ?? raw;
    } catch {
      id = raw;
    }
    if (!id) return;
    await moveCandidatureToList(id, listType);
  }

  return {
    candidatures,
    loading,
    error,
    submitting,
    modalOpen,
    initialDataForAdd,
    dragOverList,
    draggingId,
    filterNom,
    filterTeletravail,
    filterVille,
    filterNote,
    listPages,
    isMobile,
    openMoveMenuId,
    moveMenuAnchorRef,
    villesUniques,
    refus,
    enCours,
    terminee,
    setModalOpen,
    setInitialDataForAdd,
    setOpenMoveMenuId,
    setListPages,
    setFilterNom,
    setFilterTeletravail,
    setFilterVille,
    setFilterNote,
    handleAddCandidature,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    moveCandidatureToList,
  };
}
