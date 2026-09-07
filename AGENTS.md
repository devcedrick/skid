# AGENTS.md

- Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code. Expo has changed; do not rely on memory of older SDKs.
- Stack: Expo SDK ~57.0.20, React 19.2.3, React Native 0.86.3, `expo-router` ~57.0.19, NativeWind 4.2.6 + `tailwindcss` 3.4.17.
- Source of truth in `docs/`: `PROJECT.md` (features, tabs, target structure), `REQUIREMENTS.md` (FR/NFR/C-1..C-8), `ARCHITECTURE.md` (module contracts, data flows), `DATA_MODEL.md` (TS + SQLite contracts). Check them before coding; don't duplicate their tables here.

## Commands

- Only scripts in `package.json` are `start` / `android` / `ios` / `web` (all `expo start` variants). There is no lint, test, or typecheck script.
- Verify with `npx tsc --noEmit` and `npx expo start -c` (or `--web` for web-only check). No Jest/ESLint config exists, so don't add one unprompted.
- Managed Expo project: no `/ios` or `/android` dirs (gitignored). Don't eject or hand-edit native code; use `app.json` plugins instead. Custom native modules (OCR, GGUF inference, notifications) require Development Builds.

## Structure & Routing

- Entry: `package.json` `main` = `expo-router/entry`. Root layout `app/_layout.tsx` (imports `../global.css`, registers `(tabs)` stack + `modal`).
- File-based routing in `app/`: target is `(tabs)/index.tsx` (Today), `(tabs)/schedule.tsx` (Schedule, read-only), `(tabs)/settings.tsx` (Settings), plus `review.tsx`, `manual-add.tsx`, `session/[id].tsx`, `modal.tsx`, `+not-found.tsx`, `+html.tsx`. Note: `(tabs)/two.tsx` still exists and is pending rename to `schedule.tsx`.
- `app.json` has `experiments.typedRoutes: true`, so use typed `Link href`s only.
- Path alias: `@/*` maps to repo root (`./`), per `tsconfig.json`. Prefer `@/components/...`, `@/src/...`, `@/constants/...`. `tsconfig.json` is `strict: true`.
- `components/Themed.tsx` (`Text`/`View` + `useThemeColor`) and `constants/Colors.ts` are the theming system; use them instead of hardcoding colors. Keep the `useColorScheme.ts` / `.web.ts` and `useClientOnlyValue.ts` / `.web.ts` platform pairs together when editing.

## Architecture (thin routes → `src/`)

- `app/` screens only compose hooks + components and navigate; no business logic, no SQL in screens.
- Business logic lives in `src/`: `types/schedule.ts` (no logic), `storage/db.ts` (open + migrations) + `storage/repositories.ts` (only place that touches SQL), `ocr/ocr.ts`, `ai/parser.ts`, `notifications/reminders.ts`, `hooks/useSchedules.ts`, `utils/time.ts` + `utils/validators.ts`.
- `src/ocr` and `src/ai` ship as interfaces + stubs first (`extractText(uri) → ""`, `parseSchedule(ocrText) → { semester: null, sessions: [] }`); real inference is wired later behind the same signatures.
- Review (`review.tsx`) persists only on explicit confirm via `saveParsedSchedule`; Manual Add shares the same validators. Add entry point lives only on Today.

## Constraints

- Offline-first, on-device only: no network calls, no analytics or cloud in v1.
- Error policy: unparseable OCR/AI fields degrade to editable `null` + Review flag; never crash, never silently drop a session. Times are `HH:MM` 24h, `days` non-empty, `end_time` after `start_time`.
- Storage: `expo-sqlite` assumed; schema changes require a new migration in `src/storage/db.ts`.
- AI delivery: Qwen3 0.6B GGUF lives under `assets/models/` and is NOT committed (see `.gitignore`); keep the `.gitkeep` placeholder.
- Reminders are local notifications only, no push.

## Docs & Decision Log

- On every MAJOR change (Expo SDK major bump, storage migration/schema change, AI model or OCR engine swap, `app/` ↔ `src/` layer change, offline/privacy constraint change), all three are required:
  1. New `docs/adr/NNNN-*.md` copied from `docs/adr/0000-template.md` (Context / Decision / Consequences, plain IDs like FR-2.3, C-5).
  2. Index it in `docs/DECISIONS.md` under `## Records`.
  3. Add a `docs/CHANGELOG.md` `[Unreleased]` entry (Added / Changed / Fixed) with an `[ADR-XXXX]` ref; entry states *what*, ADR carries *why* — never duplicate reasoning.
- Never edit an accepted ADR; a reversal is a new ADR plus flipping the old file's `status:` to `superseded by [[NNNN-...]]`.

## NativeWind

- Wiring spans four places; keep them in sync: `babel.config.js` (`babel-preset-expo` with `jsxImportSource: nativewind` + `nativewind/babel`), `metro.config.js` (`withNativeWind(config, { input: "./global.css" })`), `global.css` (`@tailwind base/components/utilities`), and `app/_layout.tsx` (`import '../global.css'`).
- `tailwind.config.js` `content` covers only `./app`, `./components`, `./src`. New styled directories must be added there.
- Styling rule: layout/spacing → NativeWind `className`; color → `Themed.tsx` + `Colors.ts`; `StyleSheet` only when `className` cannot express it. Never hardcode hex in screens.
