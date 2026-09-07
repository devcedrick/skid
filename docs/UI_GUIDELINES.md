---
status: draft
tags: [ui, design, theming]
---

# 🎨 Skid - UI Guidelines

Rules for visual consistency. Tabs owned by [[PROJECT]], usability/theming
requirements by [[REQUIREMENTS]] (NFR-5, NFR-6), component inventory by
[[ARCHITECTURE]] §3 — this note carries only styling rules, using plain IDs below.

---

## 1. Stack rule (prevents className/StyleSheet mixing)

- Layout and spacing → NativeWind `className`.
- Color → `components/Themed.tsx` (`Text`/`View` + `useThemeColor`) + `constants/Colors.ts`.
- `StyleSheet` → only when `className` cannot express it.
- New semantic color → extend `Colors.ts` with both themes; never hardcode hex in screens. The `lightColor`/`darkColor` override props are the single exception (separators, overlays).

---

## 2. Tokens (single source is `constants/Colors.ts`)

Neutral surfaces structure; one blue accent carries meaning. Every text
pair targets WCAG AA (4.5:1).

| Token                    | Light                  | Dark                                 | Job                                                |
| :----------------------- | :--------------------- | :----------------------------------- | :------------------------------------------------- |
| `text`                   | `#111827`              | `#F9FAFB`                            | Primary text                                       |
| `textMuted`              | `#6B7280`              | `#9CA3AF`                            | Times, rooms, secondary info                       |
| `background`             | `#FFFFFF`              | `#000000`                            | Screen base                                        |
| `surface`                | `#F3F4F6`              | `#1C1C1E`                            | Cards: SessionCard, ConfirmList rows               |
| `border`                 | `#E5E7EB`              | `rgba(255,255,255,0.12)`             | Separators, card outlines                          |
| `tint`                   | `#2563EB`              | `#60A5FA`                            | Active tab, Add button, reminder-on, Regular badge |
| `tabIconDefault`         | `#9CA3AF`              | `#6B7280`                            | Inactive tabs                                      |
| `tabIconSelected`        | = tint                 | = tint                               | Active tab                                         |
| `success`                | `#16A34A`              | `#4ADE80`                            | Saved / confirmed feedback                         |
| `warning` on `warningBg` | `#B45309` on `#FEF3C7` | `#FBBF24` on `rgba(251,191,36,0.15)` | Flagged-for-review fields (FR-3.2)                 |
| `error`                  | `#DC2626`              | `#F87171`                            | Inline validation (NFR-5)                          |
| `exam`                   | `#7C3AED`              | `#A78BFA`                            | Exam-type badge (FR-6; Regular reuses `tint`)      |

---

## 3. Component visual contracts (ARCHITECTURE names, visual rules only)

- SessionCard (`surface` card, `border` outline): title in `text`, time + room in `textMuted`, type badge (`tint` Regular / `exam` Exam), reminder-on state in `tint`.
- DayList / ScheduleTable: rows ordered by `start_time`; Schedule read-only, no action affordances.
- ConfirmList (Review): every editable field uniform; unparseable/`null` fields highlighted with `warning` on `warningBg`, never hidden.
- ReminderToggle: off = `textMuted`, on = `tint`.

---

## 4. Per-screen rules

- Today: list + prominent Add button (Import vs. Manual choice); toggle affordance inline (FR-1.3, FR-4.1, FR-7.1).
- Schedule: full list/table, read-only, no Add button anywhere (FR-4.2, NFR-5).
- Review: flagged fields highlighted per §3; retry/discard controls placed apart from confirm so destructive choice is deliberate (FR-3.2, FR-3.3).
- Manual Add: same field order as Review; errors inline and specific, times always `HH:MM` (FR-5.2, NFR-5).
- Detail: full field set + reminder toggle + lead-time select (FR-4.3, FR-7).
- Settings: default lead time, schedule-type management, about/version (FR-8.3).

---

## 5. States (no new components for these)

- Empty: "no classes today" / "no saved schedules" with one next action (FR-4.4).
- Parsing: async progress, non-blocking navigation, cancellable (NFR-3).
- Validation: inline under the field, specific (`end after start`, `HH:MM`), `error` color (NFR-5).

---

## 6. Tab bar + platform

- Active/inactive colors from `tabIconSelected` / `tabIconDefault` (current tab-layout pattern stays).
- Keep the `useColorScheme.ts` / `.web.ts` pair together when editing theming (C-8).
