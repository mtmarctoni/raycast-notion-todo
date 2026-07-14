import { useCallback, useEffect, useState } from "react";
import { fetchHabits } from "../notion/habit";
import { HabitEntry } from "../types";

export type DayFilter = "all" | "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export function useHabits() {
  const [habits, setHabits] = useState<HabitEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [dayFilter, setDayFilter] = useState<DayFilter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const entries = await fetchHabits();
    setHabits(entries);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadHabits() {
      setLoading(true);
      const entries = await fetchHabits();
      if (!cancelled) {
        setHabits(entries);
        setLoading(false);
      }
    }
    loadHabits();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = dayFilter === "all" ? habits : habits.filter((h) => h.dayOfWeek === dayFilter);

  return { habits: filtered, allHabits: habits, loading, refresh: load, dayFilter, setDayFilter };
}
