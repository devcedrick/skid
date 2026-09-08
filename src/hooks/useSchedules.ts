import { useCallback, useEffect, useState } from 'react';
import { useSQLiteContext } from 'expo-sqlite';
import type { Day, Session } from '@/src/types/schedule';
import { getAllSessions, getTodaySessions } from '@/src/storage/repositories';

export interface SchedulesQuery {
  sessions: Session[];
  loading: boolean;
  error: Error | null;
  refresh: () => void;
}

function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error('Failed to load schedules');
}

/** Today tab binding: reads local DB instantly via repositories (NFR-3). */
export function useTodaySessions(day: Day): SchedulesQuery {
  const db = useSQLiteContext();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getTodaySessions(db, day)
      .then((rows) => {
        if (!cancelled) setSessions(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(toError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [db, day, version]);

  return { sessions, loading, error, refresh };
}

/** Schedule tab binding: full list via repositories. */
export function useAllSessions(): SchedulesQuery {
  const db = useSQLiteContext();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [version, setVersion] = useState(0);

  const refresh = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getAllSessions(db)
      .then((rows) => {
        if (!cancelled) setSessions(rows);
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(toError(e));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [db, version]);

  return { sessions, loading, error, refresh };
}
