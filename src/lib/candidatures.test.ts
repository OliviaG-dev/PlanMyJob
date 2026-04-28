import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./supabase", () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from "./supabase";
import {
  deleteCandidature,
  fetchCandidature,
  fetchCandidatures,
  insertCandidature,
  updateCandidature,
} from "./candidatures";

type MockQuery = {
  select: ReturnType<typeof vi.fn>;
  eq: ReturnType<typeof vi.fn>;
  order: ReturnType<typeof vi.fn>;
  delete: ReturnType<typeof vi.fn>;
  maybeSingle: ReturnType<typeof vi.fn>;
  insert: ReturnType<typeof vi.fn>;
  update: ReturnType<typeof vi.fn>;
  single: ReturnType<typeof vi.fn>;
};

function makeQuery(): MockQuery {
  const query: Partial<MockQuery> = {};
  query.select = vi.fn(() => query);
  query.eq = vi.fn(() => query);
  query.order = vi.fn(() => query);
  query.delete = vi.fn(() => query);
  query.maybeSingle = vi.fn();
  query.insert = vi.fn(() => query);
  query.update = vi.fn(() => query);
  query.single = vi.fn();
  return query as MockQuery;
}

function candidatureRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "c1",
    user_id: "u1",
    entreprise: "ACME",
    poste: "Dev",
    lien_offre: null,
    statut: "a_postuler",
    statut_suivi: "en_cours",
    date_candidature: "2026-04-28",
    priorite: null,
    notes: null,
    localisation: null,
    type_contrat: null,
    teletravail: null,
    source: null,
    note_personnelle: null,
    salaire_ou_fourchette: null,
    competences: null,
    created_at: "2026-04-28T00:00:00.000Z",
    updated_at: "2026-04-28T00:00:00.000Z",
    cv_envoye_at: null,
    ...overrides,
  };
}

describe("candidatures lib", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("trims fields on insert", async () => {
    const query = makeQuery();
    query.single.mockResolvedValue({
      data: {
        id: "c1",
        user_id: "u1",
        entreprise: "ACME",
        poste: "Dev",
        lien_offre: null,
        statut: "a_postuler",
        statut_suivi: "en_cours",
        date_candidature: "2026-04-28",
        priorite: null,
        notes: "note",
        localisation: "Paris",
        type_contrat: "cdi",
        teletravail: "hybride",
        source: "linkedin",
        note_personnelle: 4,
        salaire_ou_fourchette: "45k",
        competences: "react",
        created_at: "2026-04-28T00:00:00.000Z",
        updated_at: "2026-04-28T00:00:00.000Z",
        cv_envoye_at: null,
      },
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await insertCandidature("u1", {
      entreprise: "  ACME  ",
      poste: " Dev ",
      lienOffre: "   ",
      statut: "a_postuler",
      statutSuivi: "en_cours",
      dateCandidature: "2026-04-28",
      notes: " note ",
      localisation: " Paris ",
      typeContrat: "cdi",
      teletravail: "hybride",
      source: "linkedin",
      notePersonnelle: 4,
      salaireOuFourchette: " 45k ",
      competences: " react ",
    });

    expect(query.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        entreprise: "ACME",
        poste: "Dev",
        lien_offre: null,
        notes: "note",
        localisation: "Paris",
        salaire_ou_fourchette: "45k",
        competences: "react",
      }),
    );
  });

  it("returns current candidature when update payload is empty", async () => {
    const fetchQuery = makeQuery();
    fetchQuery.maybeSingle.mockResolvedValue({
      data: candidatureRow(),
      error: null,
    });

    vi.mocked(supabase.from).mockReturnValue(fetchQuery as never);

    const result = await updateCandidature("u1", "c1", {});
    expect(result.id).toBe("c1");
    expect(fetchQuery.update).not.toHaveBeenCalled();
  });

  it("fetches candidatures list", async () => {
    const query = makeQuery();
    query.order.mockResolvedValue({ data: [candidatureRow()], error: null });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const list = await fetchCandidatures("u1");
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("c1");
  });

  it("fetches one candidature", async () => {
    const query = makeQuery();
    query.maybeSingle.mockResolvedValue({
      data: candidatureRow({ id: "c9" }),
      error: null,
    });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    const one = await fetchCandidature("u1", "c9");
    expect(one?.id).toBe("c9");
  });

  it("adds status timestamp when status changes to cv_envoye", async () => {
    const fetchQuery = makeQuery();
    fetchQuery.maybeSingle.mockResolvedValue({
      data: candidatureRow({ statut: "a_postuler" }),
      error: null,
    });
    const updateQuery = makeQuery();
    updateQuery.single.mockResolvedValue({
      data: candidatureRow({ statut: "cv_envoye", cv_envoye_at: "2026-04-28T00:00:00.000Z" }),
      error: null,
    });
    vi.mocked(supabase.from)
      .mockReturnValueOnce(fetchQuery as never)
      .mockReturnValueOnce(updateQuery as never);

    await updateCandidature("u1", "c1", { statut: "cv_envoye" });
    expect(updateQuery.update).toHaveBeenCalledWith(
      expect.objectContaining({ statut: "cv_envoye", cv_envoye_at: expect.any(String) }),
    );
  });

  it("deletes candidature", async () => {
    const query = makeQuery();
    query.eq.mockImplementationOnce(() => query).mockResolvedValue({ error: null });
    vi.mocked(supabase.from).mockReturnValue(query as never);

    await deleteCandidature("u1", "c1");
    expect(query.delete).toHaveBeenCalled();
  });
});
