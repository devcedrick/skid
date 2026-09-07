# AGENTS.md

- Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code. Expo has changed; do not rely on memory of older SDKs.
- Stack: Expo SDK ~57.0.20, React 19.2.3, React Native 0.86.3, `expo-router` ~57.0.19, NativeWind 4.2.6 + `tailwindcss` 3.4.17.

## Commands

- Only scripts in `package.json` are `start` / `android` / `ios` / `web` (all `expo start` variants). There is no lint, test, or typecheck script.
- Verify with `npx tsc --noEmit` and `npx expo start -c` (or `--web` for web-only check). No Jest/ESLint config exists, so don't add one unprompted.
- Managed Expo project: no `/ios` or `/android` dirs (gitignored). Don't eject or hand-edit native code; use `app.json` plugins instead.

## Structure

- Entry: `package.json` `main` = `expo-router/entry`. Root layout `app/_layout.tsx` (imports `../global.css`, registers `(tabs)` stack + `modal`).
- File-based routing in `app/`: `(tabs)/index.tsx`, `(tabs)/two.tsx`, `modal.tsx`, `+not-found.tsx`, `+html.tsx`. `app.json` has `experiments.typedRoutes: true`, so use typed `Link href`s.
- Path alias: `@/*` maps to repo root (`./`), per `tsconfig.json`. Prefer `@/components/...`, `@/constants/...`.
- `components/Themed.tsx` (`Text`/`View` + `useThemeColor`) and `constants/Colors.ts` are the theming system; use them instead of hardcoding colors. `useColorScheme` has `.web.ts` / `.ts` platform variants — keep both when editing.

## NativeWind

- Wiring spans four places; keep them in sync: `babel.config.js` (`babel-preset-expo` with `jsxImportSource: nativewind` + `nativewind/babel`), `metro.config.js` (`withNativeWind(config, { input: "./global.css" })`), `global.css` (`@tailwind base/components/utilities`), and `app/_layout.tsx` (`import '../global.css'`).
- `tailwind.config.js` `content` covers only `./app`, `./components`, `./src`. New styled directories must be added there.
