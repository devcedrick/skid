---
status: accepted
tags: [architecture, expo-router, offline-first]
---

# 🏗️ Skid - Architecture

Module map for the target structure in [[PROJECT]] § Project Structure. Routes stay thin; logic lives in `src/`. Offline-first, on-device only. See [[REQUIREMENTS]] for FR/NFR/constraints and [[DATA_MODEL]] for TS + SQLite contracts.

---

## 1. Layer overview

```text
app/                 thin expo-router screens (no business logic)
  └─> src/           business logic (types, storage, ocr, ai, notifications, hooks, utils)
        └─> expo-sqlite / on-device OCR / Qwen3 GGUF / expo-notifications (local only)
components/ + constants/   UI + theming (Themed.tsx + Colors.ts)
```

Rules:

- `app/` screens only compose hooks + components and navigate via typed `Link href`s (`typedRoutes: true`, C-3).
- All queries/mutations go through `src/storage/repositories.ts`; no SQL in screens (NFR-7).
- `src/ocr` and `src/ai` ship as interfaces + stubs first; real inference wired later (C-6).
- No network calls anywhere (NFR-1, NFR-2).

---

## 2. Route map

| File                                                                       | Tab / title                                       | Reads / writes                                                                    | FR trace       |
| :------------------------------------------------------------------------- | :------------------------------------------------ | :-------------------------------------------------------------------------------- | :------------- |
| `app/(tabs)/index.tsx`                                                     | **Today** — today's classes + Add button          | Reads `getTodaySessions(day)`; Add opens Import vs. Manual Add choice             | FR-1.3, FR-4.1 |
| `app/(tabs)/schedule.tsx`                                                  | **Schedule** — full list/table, read-only, no Add | Reads `getAllSessions()`                                                          | FR-4.2         |
| `app/(tabs)/settings.tsx`                                                  | **Settings** — reminder defaults, types, about    | Reads/writes settings + reminder defaults                                         | FR-7.2, FR-8.3 |
| `app/review.tsx`                                                           | Review — confirm & edit AI parse                  | Reads in-memory `ParsedSchedule`; writes via `saveParsedSchedule` on confirm only | FR-3           |
| `app/manual-add.tsx`                                                       | Manual Add form                                   | Writes via repositories, same validators as Review                                | FR-5           |
| `app/session/[id].tsx`                                                     | Session detail + reminder toggle                  | Reads `getSessionById`; writes `setReminder`                                      | FR-4.3, FR-7.1 |
| `app/_layout.tsx`, `app/(tabs)/_layout.tsx`, `modal.tsx`, `+not-found.tsx` | Shell                                             | None (nav + theming)                                                              | C-3            |

Current gap: `src/` does not exist yet; `app/(tabs)/` still contains `two.tsx` (rename to `schedule.tsx` pending); `review.tsx`, `manual-add.tsx`, `session/[id].tsx`, `settings.tsx` are not yet created. New styled code must live under `app/`, `components/`, or `src/` (C-4).

---

## 3. Module contracts

### `src/types/schedule.ts`

Re-exports the canonical contracts from DATA_MODEL §2 (`Day`, `ScheduleType`, `HHMM`, `ParsedSession`, `ParsedSchedule`). No logic, no validation here.

### `src/storage/db.ts`

Owns `expo-sqlite` open + migrations. Schema is migration v1 from DATA_MODEL §3 (`semesters`, `sessions`, `session_days`, `reminders` + index). Later schema changes add a new migration here (C-5).

### `src/storage/repositories.ts`

Only place that touches SQL. Contracts from DATA_MODEL §5:

- `getTodaySessions(day: Day)` — join `sessions` + `session_days`, hide expired exams (`valid_to < today`), order by `start_time`.
- `getAllSessions()` — full Schedule list/table.
- `getSessionById(id)` — detail screen.
- `saveParsedSchedule(parsed, kind)` — called only from Review confirm (FR-3.3).
- `setReminder(session_id, enabled, lead_minutes)` — local notifications only.

### `src/ocr/ocr.ts`

- `extractText(uri: string): Promise<string>` — stub returning `""` for now (FR-1.2). Real on-device OCR wired later behind the same signature.

### `src/ai/parser.ts`

- `parseSchedule(ocrText: string): Promise<ParsedSchedule>` — stub returning `{ semester: null, sessions: [] }` for now (FR-2.1).
- Normalizers (FR-2.3): day tokens → `Day[]` (unknown tokens dropped, session flagged for Review); times → `HH:MM | null` (unparseable → `null`, never silent drop).

### `src/notifications/reminders.ts`

Local notifications only, no push (FR-7.3, Out of Scope). `scheduleReminder(session, lead_minutes)` / `cancelReminder(session_id)`; lead-time math lives here, defaults come from Settings (FR-7.2).

### `src/hooks/useSchedules.ts`

React binding over repositories: `useTodaySessions(day)` and `useAllSessions()`. Keeps Today instant from local DB (NFR-3); AI parse runs async with progress state, never blocks navigation.

### `src/utils/time.ts` + `src/utils/validators.ts`

`HH:MM` 24h checks, `end_time` after `start_time`, `days` non-empty. Shared by Review and Manual Add so both enforce the same rules (FR-5.2, NFR-5).

### `components/` + `constants/Colors.ts`

Theming via `Themed.tsx` (`Text`/`View` + `useThemeColor`) and `Colors.ts`, light/dark supported (NFR-6). Keep the `useColorScheme.ts` / `.web.ts` pair together (C-8). Planned presentational pieces: `SessionCard`, `DayList`, `ScheduleTable`, `ConfirmList`, `ReminderToggle` — no DB or AI imports inside them.

---

## 4. Data flows (text sequences)

### Flow A — Import → OCR → AI → Review → Save (FR-1, FR-2, FR-3, FR-8.1)

1. User taps Add on Today (`app/(tabs)/index.tsx`), chooses Import.
2. Screen calls `extractText(uri)` from `src/ocr/ocr.ts` → raw string.
3. Screen calls `parseSchedule(ocrText)` from `src/ai/parser.ts` → `ParsedSchedule` (bad fields already `null`).
4. App navigates to `app/review.tsx` with the parsed object in memory; nothing persisted yet.
5. User edits fields, removes false positives, or retries/discards (FR-3.2).
6. On confirm, Review calls `saveParsedSchedule(parsed, kind)` → repositories write `semesters` + `sessions` + `session_days` rows.
7. Today and Schedule re-query from DB; empty states shown when there is nothing to list (FR-4.4).

### Flow B — Manual Add (FR-5)

1. User taps Add on Today, chooses Manual.
2. `app/manual-add.tsx` renders the form (same fields as Review).
3. On submit, `utils/validators.ts` enforces required `days` + times, `HH:MM` format, end after start.
4. Valid input goes straight to repositories; no OCR or AI involved.

### Flow C — Reads: Today vs. Schedule (FR-4, FR-6.2)

1. Today computes current `Day`, calls `getTodaySessions(day)` via `useTodaySessions`; expired exams filtered out, remainder ordered by `start_time`.
2. Schedule calls `getAllSessions()` via `useAllSessions`; expired exams remain visible here.
3. Detail (`app/session/[id].tsx`) calls `getSessionById(id)` for the full field set.

### Flow D — Reminders (FR-7)

1. User toggles reminder in detail or Today list (`ReminderToggle` component).
2. Screen calls `setReminder(session_id, enabled, lead_minutes)` → DB row + `scheduleReminder` / `cancelReminder` in `src/notifications/reminders.ts`.
3. Lead time defaults come from Settings; per-session override stored on the reminder row. Fires via local notification only.

---

## 5. Cross-cutting concerns

- **Theming:** `components/Themed.tsx` + `constants/Colors.ts`, never hardcoded colors (NFR-6).
- **NativeWind wiring (C-4):** keep `babel.config.js`, `metro.config.js`, `global.css`, and `app/_layout.tsx` (`import '../global.css'`) in sync. Styled code only under `app/`, `components/`, `src/`.
- **Routing (C-3):** entry `expo-router/entry`; typed `Link href`s only.
- **Managed workflow (C-2):** no `/ios` or `/android`; native capability via `app.json` plugins; Development Builds required for OCR/GGUF/notifications.
- **Error policy (NFR-4):** unparseable OCR/AI degrades to editable `null` + Review flag; never crash, never silently drop a session.
- **AI delivery (C-6):** Qwen3 0.6B GGUF lives under `assets/models/` and is not committed; `src/ai` + `src/ocr` are stubs until real inference lands.
- **Verification (C-7):** `npx tsc --noEmit` and `npx expo start -c`. No Jest/ESLint config; do not add unprompted.

---

## 6. Traceability (FR → modules)

| FR               | Routes                                            | `src/` modules                                                  |
| :--------------- | :------------------------------------------------ | :-------------------------------------------------------------- |
| FR-1 Import      | `(tabs)/index` Add                                | `ocr/ocr.ts`                                                    |
| FR-2 AI Parsing  | — (via Review)                                    | `ai/parser.ts`, `utils/` normalize                              |
| FR-3 Review      | `review.tsx`                                      | `repositories.saveParsedSchedule`                               |
| FR-4 Views       | `(tabs)/index`, `(tabs)/schedule`, `session/[id]` | `hooks/useSchedules`, repositories reads                        |
| FR-5 Manual Add  | `manual-add.tsx`                                  | `utils/validators`, repositories                                |
| FR-6 Types       | `settings.tsx`                                    | `types/schedule.ts`, `db.ts` (`semesters.kind`, validity dates) |
| FR-7 Reminders   | `session/[id]`, Today toggle, `settings.tsx`      | `notifications/reminders.ts`, `repositories.setReminder`        |
| FR-8 Persistence | all tabs                                          | `storage/db.ts`, `repositories.ts`                              |
