import type { Day, HHMM } from '@/src/types/schedule';

const HHMM_RE = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isHHMM(value: string): boolean {
  return HHMM_RE.test(value);
}

function toMinutes(t: HHMM): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/** Negative if a < b, 0 if equal, positive if a > b. Assumes valid HH:MM. */
export function compareHHMM(a: HHMM, b: HHMM): number {
  return toMinutes(a) - toMinutes(b);
}

export function isEndAfterStart(start: HHMM, end: HHMM): boolean {
  return compareHHMM(end, start) > 0;
}

/**
 * Normalize OCR / user input to HH:MM 24h.
 * Unparseable → null (never throws). Accepts:
 * - "09:30", "9:05" → "09:05"
 * - "09.30" → "09:30"
 * - "0930" → "09:30"
 * - "2:30 PM" → "14:30"
 */
export function normalizeTime(input: string | null | undefined): HHMM | null {
  if (input == null) return null;
  const raw = input.trim();
  if (raw === '') return null;
  if (HHMM_RE.test(raw)) return raw;

  const m = raw.match(/^(\d{1,2})[:.](\d{2})\s*([AaPp])\.?\s*\.?[Mm]\.?$/);
  if (m) {
    let h = Number(m[1]);
    const min = Number(m[2]);
    const pm = m[3].toUpperCase() === 'P';
    if (h < 1 || h > 12 || min > 59) return null;
    if (pm && h !== 12) h += 12;
    if (!pm && h === 12) h = 0;
    const out = `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
    return isHHMM(out) ? out : null;
  }

  const hm = raw.match(/^(\d{1,2})[:.](\d{2})$/);
  if (hm) {
    const out = `${hm[1].padStart(2, '0')}:${hm[2]}`;
    return isHHMM(out) ? out : null;
  }

  const flat = raw.match(/^(\d{3,4})$/);
  if (flat) {
    const p = flat[1].padStart(4, '0');
    const out = `${p.slice(0, 2)}:${p.slice(2)}`;
    return isHHMM(out) ? out : null;
  }

  return null;
}

const JS_DAY_TO_DAY: Day[] = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];

export function getDayForDate(date: Date = new Date()): Day {
  return JS_DAY_TO_DAY[date.getDay()];
}

/** Local YYYY-MM-DD for exam expiry comparisons. */
export function todayYYYYMMDD(date: Date = new Date()): string {
  const y = date.getFullYear();
  const mo = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${mo}-${d}`;
}
