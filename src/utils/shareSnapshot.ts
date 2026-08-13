import type { Candidature, Statut } from "../types/candidature";
import type {
  PublicShareSnapshot,
  ShareDuration,
  ShareTimelineEvent,
} from "../types/share.types";

const STATUT_LABELS: Record<Statut, string> = {
  a_postuler: "À postuler",
  cv_envoye: "CV envoyé",
  entretien_rh: "Entretien RH",
  entretien_technique: "Entretien technique",
  attente_reponse: "Attente de réponse",
  refus: "Refus",
  sans_reponse: "Sans réponse",
  offre: "Offre",
};

const SOURCE_LABELS: Record<NonNullable<Candidature["source"]>, string> = {
  linkedin: "LinkedIn",
  indeed: "Indeed",
  france_travail: "France Travail",
  welcome_to_the_jungle: "Welcome to the Jungle",
  hellowork: "HelloWork",
  site_entreprise: "Site entreprise",
  autre: "Autre",
};

const TYPE_CONTRAT_LABELS: Record<
  NonNullable<Candidature["typeContrat"]>,
  string
> = {
  cdi: "CDI",
  cdd: "CDD",
  alternance: "Alternance",
  stage: "Stage",
  freelance: "Freelance",
  autre: "Autre",
};

const MS_HOUR = 60 * 60 * 1000;

export function generateShareToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export function computeExpiresAt(duration: ShareDuration): string | null {
  if (duration === "never") return null;
  const hoursByDuration: Record<Exclude<ShareDuration, "never">, number> = {
    "24h": 24,
    "7d": 24 * 7,
    "30d": 24 * 30,
  };
  return new Date(
    Date.now() + hoursByDuration[duration] * MS_HOUR
  ).toISOString();
}

export function isCvEnvoye(candidature: Candidature): boolean {
  return (
    candidature.statut !== "a_postuler" || candidature.cvEnvoyeAt != null
  );
}

export function buildShareTimeline(
  candidature: Candidature
): ShareTimelineEvent[] {
  const events: ShareTimelineEvent[] = [];

  const dateCandidature =
    candidature.dateCandidature ?? candidature.createdAt;
  if (dateCandidature) {
    events.push({ date: dateCandidature, label: "Candidature enregistrée" });
  }

  if (candidature.cvEnvoyeAt) {
    events.push({ date: candidature.cvEnvoyeAt, label: "CV envoyé" });
  }

  if (candidature.entretienRhAt) {
    events.push({ date: candidature.entretienRhAt, label: "Entretien RH" });
  }

  if (candidature.entretienTechniqueAt) {
    events.push({
      date: candidature.entretienTechniqueAt,
      label: "Entretien technique",
    });
  }

  if (candidature.attenteReponseAt) {
    events.push({
      date: candidature.attenteReponseAt,
      label: "En attente de réponse",
    });
  }

  if (candidature.refusAt) {
    events.push({ date: candidature.refusAt, label: "Refus" });
  }

  return events.sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function buildPublicShareSnapshot(
  candidature: Candidature
): PublicShareSnapshot {
  return {
    entreprise: candidature.entreprise,
    poste: candidature.poste,
    localisation: candidature.localisation,
    dateCandidature: candidature.dateCandidature ?? candidature.createdAt,
    statut: candidature.statut,
    statutLabel: STATUT_LABELS[candidature.statut],
    cvEnvoye: isCvEnvoye(candidature),
    lienOffre: candidature.lienOffre,
    sourceLabel: candidature.source
      ? SOURCE_LABELS[candidature.source]
      : undefined,
    typeContratLabel: candidature.typeContrat
      ? TYPE_CONTRAT_LABELS[candidature.typeContrat]
      : undefined,
    timeline: buildShareTimeline(candidature),
    snapshotAt: new Date().toISOString(),
  };
}

export function getShareUrl(token: string): string {
  const origin =
    typeof window !== "undefined" ? window.location.origin : "";
  return `${origin}/share/${token}`;
}

export function formatShareDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function formatShareDateShort(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
  });
}

export function formatShareDateNumeric(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatShareExpiry(expiresAt: string | null): string {
  if (!expiresAt) return "Sans expiration";
  return `Expire le ${formatShareDate(expiresAt)}`;
}

export function formatShareExpiryNumeric(expiresAt: string | null): string {
  if (!expiresAt) return "Sans expiration";
  return `Expire le ${formatShareDateNumeric(expiresAt)}`;
}

export function getStatutEmoji(statut: Statut): string {
  const emojis: Record<Statut, string> = {
    a_postuler: "⚪",
    cv_envoye: "🔵",
    entretien_rh: "🟣",
    entretien_technique: "🟣",
    attente_reponse: "🟡",
    refus: "🔴",
    sans_reponse: "⚫",
    offre: "🟢",
  };
  return emojis[statut];
}
