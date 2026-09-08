import type { Day, ParsedSession } from '@/src/types/schedule';
import { isEndAfterStart, isHHMM } from '@/src/utils/time';

export const ALL_DAYS: Day[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const DAY_SET = new Set<string>(ALL_DAYS);

export function isDay(value: unknown): value is Day {
  return typeof value === 'string' && DAY_SET.has(value);
}

/** Normalize day tokens: uppercase, drop unknowns. Empty → invalid (Review flag). */
export function normalizeDays(input: unknown): { days: Day[]; valid: boolean; error?: string } {
  const list = Array.isArray(input) ? input : input == null ? [] : [input];
  const days: Day[] = [];
  for (const token of list) {
    if (typeof token !== 'string') continue;
    const up = token.trim().toUpperCase();
    if (DAY_SET.has(up) && !days.includes(up as Day)) days.push(up as Day);
  }
  if (days.length === 0) return { days, valid: false, error: 'Select at least one day' };
  return { days, valid: true };
}

export function validateTimes(
  start_time: string | null,
  end_time: string | null,
): string | null {
  if (start_time == null || start_time === '') return 'Start time is required (HH:MM)';
  if (end_time == null || end_time === '') return 'End time is required (HH:MM)';
  if (!isHHMM(start_time)) return 'Start time must be HH:MM (24h)';
  if (!isHHMM(end_time)) return 'End time must be HH:MM (24h)';
  if (!isEndAfterStart(start_time, end_time)) return 'End time must be after start time';
  return null;
}

/** Shared by Review and Manual Add. Returns inline, specific errors. */
export function validateParsedSession(session: ParsedSession): string[] {
  const errors: string[] = [];
  if (!session.days || session.days.length === 0) {
    errors.push('Select at least one day');
  } else {
    for (const d of session.days) {
      if (!isDay(d)) {
        errors.push(`Invalid day: ${String(d)}`);
        break;
      }
    }
  }
  const timeError = validateTimes(session.start_time, session.end_time);
  if (timeError) errors.push(timeError);
  return errors;
}

export function isValidDateString(value: string | null): boolean {
  if (value == null || value === '') return true;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00`);
  return !Number.isNaN(d.getTime());
}
