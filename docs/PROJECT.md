# 📚 Skid - Smart Schedule Maker

Skid is a mobile application that helps students convert printed or handwritten class schedules into a clean digital format. The app uses an on-device AI model to parse messy text (from OCR) into structured schedule data—all without requiring an internet connection.

---

## 🎯 Purpose

Students often receive class schedules as printed papers, PDFs, or photos. Manually typing these into a calendar app is tedious and error-prone. Skid solves this by letting users:

- Take a photo or import a file
- Have the schedule parsed automatically
- Review, edit, and save it to their phone
- Get reminders before each class

---

## 📱 Core Features

| Feature                    | Description                                                                                                          |
| :------------------------- | :------------------------------------------------------------------------------------------------------------------- |
| **Import**                 | Import images or PDF files containing a class schedule.                                                              |
| **AI Parsing**             | An on-device AI model processes raw OCR text and extracts subjects, times, rooms, and days into a structured format. |
| **Confirmation & Editing** | Users review the parsed schedule, correct any mistakes, and confirm before saving.                                   |
| **Schedule Views**         | Toggle between Week View and Day View to see upcoming classes.                                                       |
| **Reminders**              | Enable/disable alarms per class. Choose how many minutes/hours before class the reminder triggers.                   |
| **Schedule Types**         | Supports both **Regular** class schedules and **Exam** schedules (which have a limited validity period).             |
| **Manual Add**             | Users can add classes manually without using the camera or AI.                                                       |
| **Offline-First**          | All features work without any internet connection.                                                                   |

---

## 🛠️ Tech Stack

This project is built with the following technologies:

- **React Native** – Cross-platform mobile framework
- **Expo** – Development toolchain (using Development Builds)
- **NativeWind** – Tailwind CSS styling for React Native
- **TypeScript** – Static type checking
- **Qwen3 0.6B** – Fine-tuned language model (exported to GGUF format) for parsing OCR output

---

## 🔄 Basic User Flow

1. User opens the app.
2. User imports an image or PDF of their class schedule.
3. The app extracts text using on-device OCR.
4. The extracted text is sent to the fine-tuned AI model.
5. The AI returns structured data (subjects, times, rooms, days).
6. User sees a confirmation screen with the parsed schedule.
7. User can edit any incorrect fields manually.
8. User saves the schedule to the app's local storage.
9. Schedule appears in Week or Day view.
10. User can enable reminders for individual classes.

---

## 🤖 AI Output Format

The fine-tuned AI model parses raw OCR text into the following structured JSON format:

```json
{
  "semester": "<string | null>",
  "sessions": [
    {
      "course_code": "<string | null>",
      "course_name": "<string | null>",
      "offering_number": "<string | null>",
      "type": "<string | null>",
      "days": ["<string>"],
      "start_time": "<HH:MM | null>",
      "end_time": "<HH:MM | null>",
      "location": "<string | null>",
      "instructor": "<string | null>"
    }
  ]
}
```

---

## 🧭 Tabs

| Route                     | Working label | Recommended title | Behavior                                                                               |
| :------------------------ | :------------ | :---------------- | :------------------------------------------------------------------------------------- |
| `app/(tabs)/index.tsx`    | HOME (?)      | **Today**         | Displays today's classes. Add button lives here (entry point for Import / Manual Add). |
| `app/(tabs)/schedule.tsx` | SCHEDULE (?)  | **Schedule**      | Full LIST/TABLE view of all class schedules. Read-only, clutter-free — no Add button.  |
| `app/(tabs)/settings.tsx` | SETTINGS      | **Settings**      | Reminder defaults, schedule-type management, about.                                    |

Rationale:

- **Today** over HOME: tells the user exactly what they will see (classes scheduled this day).
- **Schedule** over SCHEDULE: implies the complete overview vs. the daily subset on Today.
- Keeping Add only on Today preserves the Schedule tab as a clean reference view.

---

## 🏗️ Project Structure

```text
skid/
├── app/                          # expo-router routes only (thin screens)
│   ├── _layout.tsx               # root Stack (imports ../global.css)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tabs: Today | Schedule | Settings
│   │   ├── index.tsx             # Today — today's classes + Add button
│   │   ├── schedule.tsx          # Schedule — full list/table, read-only (rename from two.tsx)
│   │   └── settings.tsx          # Settings — reminder defaults, schedule types
│   ├── review.tsx                # Confirmation & Editing of AI ParsedSchedule
│   ├── manual-add.tsx            # Manual Add form (no camera/AI)
│   ├── session/[id].tsx          # Session detail + per-class reminder toggle + lead time
│   ├── modal.tsx / +not-found.tsx / +html.tsx
├── src/                          # business logic (covered by tailwind content globs)
│   ├── types/schedule.ts         # Semester, Session, ParsedSchedule (= AI JSON), ScheduleType Regular|Exam
│   ├── storage/db.ts             # expo-sqlite open + migrations
│   ├── storage/repositories.ts   # schedules/sessions CRUD, queries by day/time
│   ├── ocr/ocr.ts                # interface extractText(uri) → stub
│   ├── ai/parser.ts              # parseSchedule(ocrText) → ParsedSchedule stub + HH:MM/days normalize
│   ├── notifications/reminders.ts# schedule/cancel + lead-time logic (expo-notifications iface)
│   ├── hooks/useSchedules.ts     # Today / Schedule queries
│   └── utils/time.ts + utils/validators.ts
├── components/                   # Themed.tsx system + SessionCard, DayList, ScheduleTable, ConfirmList, ReminderToggle
├── constants/Colors.ts           # theming system (with useColorScheme.ts/.web.ts)
├── assets/models/.gitkeep        # Qwen3 0.6B GGUF goes here (binary not committed)
└── docs/PROJECT.md
```

Notes:

- Storage assumes **expo-sqlite** (structured queries for Today-by-day and full Schedule list).
- `src/ai` and `src/ocr` are **interfaces + stubs**; real llama.cpp / MLKit wiring comes later.
- New styled code must live under `app/`, `components/`, or `src/` (see `tailwind.config.js` content). Use `@/*` imports. Native capabilities via `app.json` plugins only (managed Expo). `typedRoutes: true` → typed `Link href`s.

---

## 📌 Notes

- The AI model runs **entirely on-device**—no data is sent to the cloud.
- The app handles two types of schedules: regular classes and exams.
- The project is in its early stages. More technical decisions will be made as development progresses.
- The project structure is still subject to change based on industry-standard conventions.