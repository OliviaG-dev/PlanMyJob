type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
};

const MIGRATION_HINT =
  "Exécute (ou ré-exécute) le script supabase/migrations/20260813120000_shares.sql dans Supabase, puis attends 10 s ou recharge le schéma API (Project Settings → API).";

export function formatShareError(err: unknown): string {
  if (!(err instanceof Error) && typeof err !== "object") {
    return "Erreur inconnue";
  }

  const error = err as SupabaseLikeError;
  const message = error.message ?? (err instanceof Error ? err.message : "");
  const code = error.code ?? "";

  if (
    code === "PGRST202" ||
    code === "PGRST205" ||
    message.includes("Could not find the function") ||
    message.includes("Could not find the table")
  ) {
    return `Configuration Supabase incomplète (404). ${MIGRATION_HINT}`;
  }

  if (code === "42883" || message.includes("function") && message.includes("does not exist")) {
    return `Fonction SQL manquante. ${MIGRATION_HINT}`;
  }

  if (code === "42P01" || message.includes("relation") && message.includes("does not exist")) {
    if (message.includes("monthly_reports")) {
      return `Table « monthly_reports » manquante. Exécute supabase/migrations/20260813140000_monthly_reports.sql dans Supabase.`;
    }
    return `Table « shares » manquante. ${MIGRATION_HINT}`;
  }

  if (message.includes("not authenticated")) {
    return "Session expirée. Reconnecte-toi puis réessaie.";
  }

  if (message.includes("candidature not found")) {
    return "Candidature introuvable ou accès refusé.";
  }

  return message || "Erreur lors de l'opération de partage";
}
