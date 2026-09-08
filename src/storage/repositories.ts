import type * as SQLite from 'expo-sqlite';
import type { Day, ParsedSchedule, ScheduleType, Session } from '@/src/types/schedule';
import { generateId } from '@/src/storage/db';
import { todayYYYYMMDD } from '@/src/utils/time';

export const DEFAULT_LEAD_MINUTES = 15;

type SessionRow = {
  id: string;
  semester_id: string | null;
  course_code: string | null;
  course_name: string | null;
  offering_number: string | null;
  type: string | null;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  instructor: string | null;
  days_csv: string | null;
  semester_name: string | null;
  semester_kind: ScheduleType | null;
  semester_valid_from: string | null;
  semester_valid_to: string | null;
  reminder_enabled: 0 | 1 | null;
  reminder_lead_minutes: number | null;
};

const SESSION_COLUMNS = `
  s.id, s.semester_id, s.course_code, s.course_name, s.offering_number,
  s.type, s.start_time, s.end_time, s.location, s.instructor,
  GROUP_CONCAT(sd.day, ',') AS days_csv,
  sem.name AS semester_name, sem.kind AS semester_kind,
  sem.valid_from AS semester_valid_from, sem.valid_to AS semester_valid_to,
  r.enabled AS reminder_enabled, r.lead_minutes AS reminder_lead_minutes
`;

const SESSION_JOINS = `
  FROM sessions s
  LEFT JOIN session_days sd ON sd.session_id = s.id
  LEFT JOIN semesters sem ON sem.id = s.semester_id
  LEFT JOIN reminders r ON r.session_id = s.id
`;

function mapRow(row: SessionRow): Session {
  return {
    id: row.id,
    semester_id: row.semester_id,
    course_code: row.course_code,
    course_name: row.course_name,
    offering_number: row.offering_number,
    type: row.type,
    start_time: row.start_time,
    end_time: row.end_time,
    location: row.location,
    instructor: row.instructor,
    days: row.days_csv ? (row.days_csv.split(',') as Day[]) : [],
    semester_name: row.semester_name,
    semester_kind: row.semester_kind,
    semester_valid_from: row.semester_valid_from,
    semester_valid_to: row.semester_valid_to,
    reminder_enabled: row.reminder_enabled ?? 0,
    reminder_lead_minutes: row.reminder_lead_minutes ?? DEFAULT_LEAD_MINUTES,
  };
}

// Null start_time sorts last; remainder ordered by start_time.
const ORDER_BY_TIME = `
  GROUP BY s.id
  ORDER BY CASE WHEN s.start_time IS NULL OR s.start_time = '' THEN 1 ELSE 0 END,
    s.start_time, s.id
`;

/**
 * Today tab query: sessions for one day, expired exams hidden
 * (valid_to < today), remainder ordered by start_time.
 */
export async function getTodaySessions(
  db: SQLite.SQLiteDatabase,
  day: Day,
  today: string = todayYYYYMMDD(),
): Promise<Session[]> {
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT ${SESSION_COLUMNS} ${SESSION_JOINS}
     WHERE EXISTS (SELECT 1 FROM session_days sd2 WHERE sd2.session_id = s.id AND sd2.day = ?)
       AND (sem.id IS NULL OR sem.kind != 'exam'
         OR sem.valid_to IS NULL OR sem.valid_to = '' OR sem.valid_to >= ?)
     ${ORDER_BY_TIME}`,
    [day, today],
  );
  return rows.map(mapRow);
}

/** Schedule tab query: full list, expired exams remain visible. */
export async function getAllSessions(db: SQLite.SQLiteDatabase): Promise<Session[]> {
  const rows = await db.getAllAsync<SessionRow>(
    `SELECT ${SESSION_COLUMNS} ${SESSION_JOINS} ${ORDER_BY_TIME}`,
  );
  return rows.map(mapRow);
}

/** Detail screen query. */
export async function getSessionById(
  db: SQLite.SQLiteDatabase,
  id: string,
): Promise<Session | null> {
  const row = await db.getFirstAsync<SessionRow>(
    `SELECT ${SESSION_COLUMNS} ${SESSION_JOINS} WHERE s.id = ? GROUP BY s.id`,
    [id],
  );
  return row ? mapRow(row) : null;
}

/**
 * Review confirm only (FR-3.3). Creates one semester row for the parsed
 * batch, then one sessions row + session_days rows + default reminder
 * per entry. Never drops a session: empty days persist without day rows
 * for correction. Atomic via transaction.
 */
export async function saveParsedSchedule(
  db: SQLite.SQLiteDatabase,
  parsed: ParsedSchedule,
  kind: ScheduleType,
): Promise<string> {
  const semesterId = generateId();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      'INSERT INTO semesters (id, name, kind, valid_from, valid_to) VALUES (?, ?, ?, NULL, NULL)',
      [semesterId, parsed.semester, kind],
    );
    for (const entry of parsed.sessions) {
      const sessionId = generateId();
      await db.runAsync(
        `INSERT INTO sessions
          (id, semester_id, course_code, course_name, offering_number, type,
           start_time, end_time, location, instructor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          semesterId,
          entry.course_code,
          entry.course_name,
          entry.offering_number,
          entry.type,
          entry.start_time,
          entry.end_time,
          entry.location,
          entry.instructor,
        ],
      );
      for (const day of entry.days) {
        await db.runAsync('INSERT OR IGNORE INTO session_days (session_id, day) VALUES (?, ?)', [
          sessionId,
          day,
        ]);
      }
      await db.runAsync(
        'INSERT OR IGNORE INTO reminders (session_id, enabled, lead_minutes) VALUES (?, 0, ?)',
        [sessionId, DEFAULT_LEAD_MINUTES],
      );
    }
  });
  return semesterId;
}

/** Local-notification preference only (no push). Upserts the reminder row. */
export async function setReminder(
  db: SQLite.SQLiteDatabase,
  session_id: string,
  enabled: boolean,
  lead_minutes: number,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO reminders (session_id, enabled, lead_minutes) VALUES (?, ?, ?)
     ON CONFLICT(session_id) DO UPDATE SET enabled = excluded.enabled, lead_minutes = excluded.lead_minutes`,
    [session_id, enabled ? 1 : 0, lead_minutes],
  );
}
