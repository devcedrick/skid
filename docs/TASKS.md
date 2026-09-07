---
status: draft
tags: [tasks, build-order]
---

# ✅ Skid - Tasks

Build-ordered checklist. FRs are owned by [[REQUIREMENTS]], module contracts by [[ARCHITECTURE]], schemas by [[DATA_MODEL]] — this note carries only order + done-criteria, using plain IDs below.

---

## Phase 0 — Data foundation (no UI)

- [ ] T0.1 `src/types/schedule.ts` — types per DATA_MODEL §2 (FR-2.2, FR-6.1). Done: `tsc` clean.
- [ ] T0.2 `src/utils/validators.ts` + `src/utils/time.ts` — HH:MM 24h, end after start, days non-empty (FR-2.3, FR-5.2). Done: Review and Manual Add share them.
- [ ] T0.3 `src/storage/db.ts` — migration v1 per DATA_MODEL §3 (C-5, FR-8.1). Done: relaunch restores data.
- [ ] T0.4 `src/storage/repositories.ts` — 5 query contracts per DATA_MODEL §5 (FR-3.3, FR-4, FR-6.2, FR-8). Done: no SQL outside this file (NFR-7).
- [ ] T0.5 `src/hooks/useSchedules.ts` — `useTodaySessions` / `useAllSessions` over repositories (NFR-3). Done: Today renders from local DB instantly.

---

## Phase 1 — Read views on seeded data

- [ ] T1.1 Rename `app/(tabs)/two.tsx` → `app/(tabs)/schedule.tsx`; retitle tabs Today | Schedule | Settings (FR-4, NFR-5).
- [ ] T1.2 Today tab (`app/(tabs)/index.tsx`) — filter by current day, hide expired exams, order by `start_time`, empty state (FR-4.1, FR-4.4, FR-6.2).
- [ ] T1.3 Schedule tab — full list/table, read-only, no Add button (FR-4.2, NFR-5).
- [ ] T1.4 `app/session/[id].tsx` — full field set for one session (FR-4.3).
- [ ] T1.5 `SessionCard`, `DayList`, `ScheduleTable` — presentational only, no DB/AI imports (NFR-6, NFR-7).

---

## Phase 2 — Write paths (no camera/AI yet)

- [ ] T2.1 `app/manual-add.tsx` — form enforcing the same validators as Review, no camera/AI (FR-5).
- [ ] T2.2 `app/review.tsx` + `ConfirmList` — edit every field, remove false positives, retry/discard; persist only on explicit confirm via `saveParsedSchedule` (FR-3).
- [ ] T2.3 Edit / delete saved sessions (FR-8.2).

---

## Phase 3 — Import pipeline (stubs)

A stub = real signature, fake body (C-6). Real inference is a future phase, not here.

- [ ] T3.1 `src/ocr/ocr.ts` — `extractText(uri)` stub returning `""` (FR-1.2).
- [ ] T3.2 `src/ai/parser.ts` — `parseSchedule(ocrText)` stub returning `{ semester: null, sessions: [] }`, plus days/HH:MM normalizers with null-degrade (FR-2, NFR-4).
- [ ] T3.3 Today Add button — Import vs. Manual choice wired to pipeline → Review (FR-1.1, FR-1.3).

---

## Phase 4 — Reminders + Settings

- [ ] T4.1 `src/notifications/reminders.ts` — local-only schedule/cancel + lead-time logic, no push (FR-7.3, C-2).
- [ ] T4.2 `ReminderToggle` in detail and Today list; per-session lead-time select (FR-7.1, FR-7.2).
- [ ] T4.3 `app/(tabs)/settings.tsx` — default lead time, schedule-type management, about/version (FR-8.3).

---

## Phase 5 — Verification + hardening

- [ ] T5.1 `npx tsc --noEmit` clean; `npx expo start -c` runs (C-7).
- [ ] T5.2 NFR sweep: fully offline (NFR-1, NFR-2), unparseable input degrades to editable `null` (NFR-4), Add lives only on Today (NFR-5), light/dark theming incl. `useColorScheme` pair intact (NFR-6, C-8).

---

## Out of scope for this list

Real llama.cpp / MLKit wiring and GGUF delivery (C-6, later phase); everything in REQUIREMENTS §4.
