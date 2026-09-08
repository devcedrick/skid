export type Day = 'MON' | 'TUE' | 'WED' | 'THU' | 'FRI' | 'SAT' | 'SUN';

export type ScheduleType = 'regular' | 'exam';

// Validated as HH:MM 24h in utils/validators.ts
export type HHMM = string;

export interface ParsedSession {
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

export interface ParsedSchedule {
  semester: string | null;
  sessions: ParsedSession[];
}

export interface Semester {
  id: string;
  name: string | null;
  kind: ScheduleType;
  valid_from: string | null;
  valid_to: string | null;
}

export interface Session {
  id: string;
  semester_id: string | null;
  course_code: string | null;
  course_name: string | null;
  offering_number: string | null;
  type: string | null;
  start_time: HHMM | null;
  end_time: HHMM | null;
  location: string | null;
  instructor: string | null;
  days: Day[];
  semester_name: string | null;
  semester_kind: ScheduleType | null;
  semester_valid_from: string | null;
  semester_valid_to: string | null;
  reminder_enabled: 0 | 1;
  reminder_lead_minutes: number;
}

export interface Reminder {
  session_id: string;
  enabled: 0 | 1;
  lead_minutes: number;
}
