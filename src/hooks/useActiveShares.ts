import { useCallback, useEffect, useState } from "react";
import { fetchActiveSharesForUser } from "../lib/share";
import type { ActiveShareSummary } from "../types/share.types";
import { formatShareError } from "../utils/shareErrors";

type UseActiveSharesResult = {
  shares: ActiveShareSummary[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

export function useActiveShares(userId: string | undefined): UseActiveSharesResult {
  const [shares, setShares] = useState<ActiveShareSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!userId) {
      setShares([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await fetchActiveSharesForUser(userId);
      setShares(data);
    } catch (err) {
      setError(formatShareError(err));
      setShares([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { shares, loading, error, reload };
}
