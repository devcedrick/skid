# 📋 Skid - Requirements

Derived from [[PROJECT]]. Stack: Expo SDK ~57, React Native, expo-router, NativeWind, TypeScript, Qwen3 0.6B (GGUF, on-device), expo-sqlite for local storage.

---

## 1. Functional Requirements

### FR-1 Import

- FR-1.1: User can import a class schedule from an image (camera photo or gallery) or a PDF file.
- FR-1.2: App extracts raw text from the imported file via on-device OCR (`src/ocr/ocr.ts`).
- FR-1.3: Import entry points live on the **Today** tab (`app/(tabs)/index.tsx`) via the Add button (Import vs. Manual Add choice).

### FR-2 AI Parsing

- FR-2.1: Raw OCR text is passed to the on-device Qwen3 0.6B model (`src/ai/parser.ts`).
- FR-2.2: Model output MUST conform to the AI Output Format in PROJECT:
  - `semester: string | null`
  - `sessions[]` with `course_code`, `course_name`, `offering_number`, `type`, `days[]`, `start_time` / `end_time` (`HH:MM | null`), `location`, `instructor` (all nullable except `days`).
- FR-2.3: Parser normalizes `days` values and `HH:MM` times; unparseable fields become `null` (never dropped silently) for user correction.

### FR-3 Confirmation & Editing

- FR-3.1: Parsed result is shown on a Review screen (`app/review.tsx`) before anything is saved.
- FR-3.2: User can edit every field of every session, remove false-positive sessions, and retry/discard the parse.
- FR-3.3: Nothing is persisted until the user explicitly confirms.

### FR-4 Schedule Views

- FR-4.1: **Today** tab (`app/(tabs)/index.tsx`): shows only sessions scheduled for the current day, ordered by `start_time`.
- FR-4.2: **Schedule** tab (`app/(tabs)/schedule.tsx`): full LIST/TABLE view of all saved sessions; read-only and clutter-free (no Add button).
- FR-4.3: Session detail (`app/session/[id].tsx`): shows all fields for one session.
- FR-4.4: Empty states for "no classes today" and "no saved schedules".

### FR-5 Manual Add

- FR-5.1: User can add a session manually (`app/manual-add.tsx`) without camera or AI.
- FR-5.2: Manual form enforces the same validation as Review (required `days` + times, `HH:MM` format, end after start).

### FR-6 Schedule Types

- FR-6.1: Supports **Regular** and **Exam** schedule types (`src/types/schedule.ts`).
- FR-6.2: Exam schedules carry a limited validity period (start/end date); expired exams are hidden from Today by default but remain viewable in Schedule.

### FR-7 Reminders

- FR-7.1: User can enable/disable a reminder per session (`src/notifications/reminders.ts`, toggled from detail and Today list).
- FR-7.2: User can choose lead time (minutes/hours before `start_time`); defaults configurable in **Settings**.
- FR-7.3: Reminders fire via local notifications only (no push service).

### FR-8 Persistence & Settings

- FR-8.1: Confirmed schedules persist locally via expo-sqlite (`src/storage/`); relaunch restores Today/Schedule without re-import.
- FR-8.2: User can edit or delete saved sessions.
- FR-8.3: **Settings** tab (`app/(tabs)/settings.tsx`): default reminder lead time, schedule-type management, about/version.

---

## 2. Non-functional Requirements

- NFR-1 **Offline-first:** all features (import, OCR, AI parse, views, reminders, CRUD) work with no internet connection.
- NFR-2 **Privacy / on-device:** no schedule text, images, or parsed data leaves the device; no analytics or cloud calls in v1.
- NFR-3 **Performance:** Today view renders from local DB instantly; AI parse runs async with progress state and never blocks navigation (target: usable on mid-range Android devices with a 0.6B GGUF model).
- NFR-4 **Reliability:** unparseable OCR/AI output degrades to editable `null` fields rather than crashes or silent data loss.
- NFR-5 **Usability:** Add action exists only on Today; Schedule stays a clean reference view. Times consistently displayed as `HH:MM`; validation errors are inline and specific.
- NFR-6 **Theming:** follows existing `components/Themed.tsx` + `constants/Colors.ts` system with light/dark support.
- NFR-7 **Maintainability:** routes stay thin; logic lives in `src/` (`types`, `storage`, `ocr`, `ai`, `notifications`, `hooks`, `utils`); `@/*` path alias used throughout.

---

## 3. Constraints

- C-1 **Expo SDK ~57.0.20**, React 19.2.3, RN 0.86.3, expo-router ~57.0.19, NativeWind 4.2.6 + tailwindcss 3.4.17 — do not rely on older-SDK memory; check https://docs.expo.dev/versions/v57.0.0/ before coding.
- C-2 **Managed Expo workflow:** no `/ios` or `/android` dirs; no eject or hand-edited native code — native capability via `app.json` plugins only. Requires Development Builds for custom native modules (OCR, GGUF inference, notifications).
- C-3 **Routing:** entry `expo-router/entry`; `app/_layout.tsx` must keep `import '../global.css'`; `experiments.typedRoutes: true` → typed `Link href`s only.
- C-4 **NativeWind wiring kept in sync:** `babel.config.js` (`jsxImportSource: nativewind` + `nativewind/babel`), `metro.config.js` (`withNativeWind`), `global.css`, `app/_layout.tsx`. `tailwind.config.js` content covers only `./app`, `./components`, `./src` — new styled code goes in those dirs.
- C-5 **Storage:** expo-sqlite assumed; schema changes require migrations in `src/storage/db.ts`.
- C-6 **AI delivery:** Qwen3 0.6B GGUF binary lives under `assets/models/` and is NOT committed (large binary); `src/ai` + `src/ocr` ship as interfaces + stubs first, real inference later.
- C-7 **Verification:** only scripts are `start` / `android` / `ios` / `web`; verify with `npx tsc --noEmit` and `npx expo start -c`. No Jest/ESLint config — do not add unprompted.
- C-8 **Platform variants:** keep `useColorScheme.ts` + `.web.ts` pair when editing theming/hooks.

---

## 4. Out of Scope

- Cloud sync, backup, accounts, or any backend service.
- Sharing schedules between devices/users; export to Google Calendar / ICS / PDF.
- Automatic conflict detection, timetable optimization, or attendance tracking.
- Remote push notifications, email/SMS reminders, or widgets.
- Multi-language UI, accessibility audit, or full internationalization in v1.
- Handwritten-OCR accuracy guarantees — messy input is handled via the Review/Edit step, not promised as perfect parse.
- Ejecting to bare React Native or adding web-only features beyond what `expo start --web` already supports.