---
status: accepted
tags: [data-model, sqlite, typescript]
---

# 🗄️ Skid - Data Model

Canonical TypeScript + SQLite contracts for `src/types/schedule.ts` and `src/storage/`. Derived from the AI Output Format in [[PROJECT]] and FR-2 / FR-6 / FR-8 in [[REQUIREMENTS]].

---

## 1. Entities

### Semester

- `id: string` (local UUID)
- `name: string | null` (from AI `semester`; null = unparsed/unspecified)
- `kind: ScheduleType` (`regular` | `exam`)
- `valid_from: string | null` (`YYYY-MM-DD`, exam only)
- `valid_to: string | null` (`YYYY-MM-DD`, exam only; null = open-ended regular)

### Session

One row per class session (mirrors one AI `sessions[]` entry):

- `id: string` (local UUID)
- `semester_id: string | null` (FK → semesters; null = standalone/manual)
- `course_code: string | null`
- `course_name: string | null`
- `offering_number: string | null`
- `type: string | null` (e.g. Lecture / Lab; free-form from AI)
- `start_time: string | null` (`HH:MM` 24h; null = unparseable, fix in Review)
- `end_time: string | null` (`HH:MM`; must be after `start_time` when both present)
- `location: string | null`
- `instructor: string | null`

### SessionDay (join table)

- `session_id: string` (FK → sessions, cascade delete)
- `day: Day` (`MON` | `TUE` | `WED` | `THU` | `FRI` | `SAT` | `SUN`)
- PK: `(session_id, day)`

> Why a join table instead of CSV: Today-by-day queries (`WHERE day = ? ORDER BY start_time`) stay indexed and simple; see `hooks/useSchedules.ts`.

### Reminder

- `session_id: string` (PK + FK → sessions, cascade delete)
- `enabled: 0 | 1`
- `lead_minutes: number` (default from Settings; e.g. 15)

---

## 2. TypeScript contracts (`src/types/schedule.ts`)

```ts
type Day = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';
type ScheduleType = 'regular' | 'exam';
type HHMM = string; // validated as HH:MM 24h in utils/validators.ts

interface ParsedSession {
  course_code: string | null;
  course_name: string | null;
  offering_number: string | null;
  type: string | null;
  days: Day[];
  start_time: HHMM | null;
  end_time: HHMM | null;
  location: string | null;
  instructor: string | null;
}

interface ParsedSchedule {
  semester: string | null;
  sessions: ParsedSession[];
}
```

Rules (FR-2.3, FR-5.2):

- `days` is required and non-empty; unknown day tokens → dropped, session flagged for Review.
- Unparseable times/locations/instructors → `null`, never dropped silently.
- `end_time` must be after `start_time` when both present; violations flagged in Review / Manual Add.

---

## 3. SQLite schema (`src/storage/db.ts`, migration v1)

```sql
CREATE TABLE semesters (
  id TEXT PRIMARY KEY,
  name TEXT,
  kind TEXT NOT NULL CHECK (kind IN ('regular','exam')),
  valid_from TEXT,
  valid_to TEXT
);

CREATE TABLE sessions (
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

CREATE TABLE session_days (
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  day TEXT NOT NULL CHECK (day IN ('MON','TUE','WED','THU','FRI','SAT','SUN')),
  PRIMARY KEY (session_id, day)
);

CREATE TABLE reminders (
  session_id TEXT PRIMARY KEY REFERENCES sessions(id) ON DELETE CASCADE,
  enabled INTEGER NOT NULL DEFAULT 0,
  lead_minutes INTEGER NOT NULL DEFAULT 15
);

CREATE INDEX idx_session_days_day_time
  ON session_days(day, session_id);
```

Later migrations go in `src/storage/db.ts` (per C-5).

---

## 4. AI JSON → TS → DB mapping

| AI JSON field                | TS field                    | DB column                  | Null handling                           |
| :--------------------------- | :-------------------------- | :------------------------- | :-------------------------------------- |
| `semester`                   | `ParsedSchedule.semester`   | `semesters.name`           | null → unnamed semester                 |
| `sessions[].course_code`     | `ParsedSession.course_code` | `sessions.course_code`     | null stays null, editable               |
| `sessions[].course_name`     | `course_name`               | `sessions.course_name`     | same                                    |
| `sessions[].offering_number` | `offering_number`           | `sessions.offering_number` | same                                    |
| `sessions[].type`            | `type`                      | `sessions.type`            | same                                    |
| `sessions[].days[]`          | `days: Day[]`               | `session_days` rows        | empty → Review flag                     |
| `sessions[].start_time`      | `start_time`                | `sessions.start_time`      | bad format → null                       |
| `sessions[].end_time`        | `end_time`                  | `sessions.end_time`        | bad format / before start → null + flag |
| `sessions[].location`        | `location`                  | `sessions.location`        | null stays null                         |
| `sessions[].instructor`      | `instructor`                | `sessions.instructor`      | null stays null                         |

---

## 5. Query contracts (`src/storage/repositories.ts`, `src/hooks/useSchedules.ts`)

- `getTodaySessions(day: Day): Session[]` — join `sessions` + `session_days`, filter expired exams (`valid_to < today` hidden from Today, still in Schedule per FR-6.2), order by `start_time`.
- `getAllSessions(): Session[]` — full Schedule tab list/table.
- `getSessionById(id): Session | null` — detail screen.
- `saveParsedSchedule(parsed: ParsedSchedule, kind: ScheduleType): void` — only called from Review confirm (FR-3.3).
- `setReminder(session_id, enabled, lead_minutes): void` — local notifications only.

---

## 6. Acceptance

- Every FR-2.2 field round-trips OCR → Review → DB → Today/Schedule with no silent loss.
- Expired exams hidden from Today, visible in Schedule.
- Empty states work: no sessions, no classes today.
