import { TrainingSession } from '../types';

/** Consecutive-day streak counting back from today/yesterday. */
export function getStreakFromSessions(sessions: TrainingSession[]): number {
  const completed = sessions.filter((s) => s.completed);
  if (completed.length === 0) return 0;
  const sorted = [...completed].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  let prev = new Date();
  prev.setHours(0, 0, 0, 0);
  for (const s of sorted) {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((prev.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) {
      streak++;
      prev = d;
    } else break;
  }
  return streak;
}

/** Monday..Sunday of the current calendar week, midnight-normalized. */
export function getWeekDates(): Date[] {
  const today = new Date();
  const dow = today.getDay(); // 0 = Sunday
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export type DayDotState = 'done' | 'today' | 'future';

/** One state per day of the current week (L..D) for the 7-dot streak row. */
export function getWeekDots(sessions: TrainingSession[]): DayDotState[] {
  const week = getWeekDates();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const doneDates = new Set(
    sessions
      .filter((s) => s.completed)
      .map((s) => {
        const d = new Date(s.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      }),
  );
  return week.map((d) => {
    if (d.getTime() === today.getTime()) return 'today';
    if (doneDates.has(d.getTime())) return 'done';
    return 'future';
  });
}

/** Minutes trained so far this calendar week (completed sessions only). */
export function getWeeklyMinutes(sessions: TrainingSession[]): number {
  const week = getWeekDates();
  const start = week[0].getTime();
  const end = week[6].getTime() + 24 * 60 * 60 * 1000;
  const totalSeconds = sessions
    .filter((s) => {
      if (!s.completed) return false;
      const t = new Date(s.date).getTime();
      return t >= start && t < end;
    })
    .reduce((sum, s) => sum + s.duration, 0);
  return Math.round(totalSeconds / 60);
}
