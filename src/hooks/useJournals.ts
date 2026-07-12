import { useCallback, useEffect, useState } from "react";
import { fetchJournals } from "../notion/journal";
import { JournalEntry } from "../types";

export function useJournals() {
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const entries = await fetchJournals();
    setJournals(entries);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadJournals() {
      setLoading(true);
      const entries = await fetchJournals();
      if (!cancelled) {
        setJournals(entries);
        setLoading(false);
      }
    }
    loadJournals();
    return () => {
      cancelled = true;
    };
  }, []);

  return { journals, setJournals, loading, refresh: load };
}
