import * as SQLite from 'expo-sqlite';

export const DATABASE_NAME = 'skid.db';
export const DATABASE_VERSION = 1;

const MIGRATION_V1 = `
PRAGMA journal_mode = 'wal';
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS semesters (
  id TEXT PRIMARY KEY,
  name TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('regular','exam')),
  valid_from TEXT,
  valid_to TEXT
);
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  semester_id TEXT REFERENCES semesters(id) ON DELETE SET NULL,
  course_code TEXT,
  course_name TEXT,
  offering_number TEXT,
  type TEXT,
  start_time TEXT,
  end_time TEXT,
  location TEXT,
  instructor TEXT
);
CREATE TABLE IF NOT EXISTS session_days (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('MON','TUE','WED','THU','FRI','SAT','SUN')),
  PRIMARY KEY (session_id, day)
);
CREATE TABLE IF NOT EXISTS reminders (
  session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0,
  lead_minutes INTEGER NOT NULL DEFAULT 15
);
CREATE INDEX IF NOT EXISTS idx_session_days_day_time
  ON session_days(day, session_id);
`;

/**
 * SQLiteProvider onInit handler. Runs migration v1 once via PRAGMA user_version.
 * Later schema changes add a new migration block here (C-5).
 */
export async function migrateDbIfNeeded(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const current = row?.user_version ?? 0;
  if (current >= DATABASE_VERSION) return;
  if (current === 0) {
    await db.execAsync(MIGRATION_V1);
  }
  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}

/** Direct open for non-Provider callers. Prefers Provider + useSQLiteContext in screens. */
export async function openSkidDb(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DATABASE_NAME);
  await migrateDbIfNeeded(db);
  return db;
}

/** Local UUID v4. Uses crypto.randomUUID when available, manual fallback otherwise. */
export function generateId(): string {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g.crypto?.randomUUID) return g.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
