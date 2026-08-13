import { useCallback, useEffect, useState } from "react";
import { fetchActiveMonthlyReportsForUser } from "../lib/monthlyReport";
import type { ActiveMonthlyReportSummary } from "../types/monthlyReport.types";
import { formatShareError } from "../utils/shareErrors";

type UseMonthlyReportsResult = {
  reports: ActiveMonthlyReportSummary[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useMonthlyReports(
  userId: string | undefined
): UseMonthlyReportsResult {
  const [reports, setReports] = useState<ActiveMonthlyReportSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setReports([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveMonthlyReportsForUser(userId);
      setReports(data);
    } catch (err) {
      setError(formatShareError(err));
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { reports, loading, error, reload };
}
