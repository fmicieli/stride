import {
  Goal,
  GoalMode,
  LevelTime,
  LevelDistance,
  DayKey,
  TrainingPlan,
  WeekPlan,
  DayActivity,
  ActivityType,
} from '../types';

const DAY_SHORTS: Record<DayKey, string> = {
  Lunes: 'Lun',
  Martes: 'Mar',
  Miércoles: 'Mié',
  Jueves: 'Jue',
  Viernes: 'Vie',
  Sábado: 'Sáb',
  Domingo: 'Dom',
};

const ALL_DAYS: DayKey[] = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo',
];

function getMethod(level: LevelTime | LevelDistance): string {
  if (level === 'never' || level === 'intervals' || level === 'under2') {
    return 'Método Caco';
  }
  return 'Método progresivo';
}

function getBaseRunDuration(week: number, goalMode: GoalMode, goal: Goal): number {
  // Returns duration in minutes
  if (goalMode === 'time') {
    const goalMinutes = goal === '20min' ? 20 : goal === '30min' ? 30 : 60;
    const startMinutes = Math.round(goalMinutes * 0.3);
    const increment = (goalMinutes - startMinutes) / 8;
    return Math.round(startMinutes + increment * (week - 1));
  } else {
    // distance mode - return run duration based on goal distance
    const goalKm = goal === '5K' ? 5 : goal === '10K' ? 10 : goal === '21K' ? 21 : 42;
    const startMin = Math.round(goalKm * 4); // ~4 min/km initially
    const endMin = Math.round(goalKm * 6.5);
    const increment = (endMin - startMin) / 8;
    return Math.round(startMin + increment * (week - 1));
  }
}

function getBaseRunDistance(week: number, goal: Goal): number {
  const goalKm = goal === '5K' ? 5 : goal === '10K' ? 10 : goal === '21K' ? 21 : 42;
  const startKm = Math.round(goalKm * 0.3 * 10) / 10;
  const increment = (goalKm - startKm) / 8;
  return Math.round((startKm + increment * (week - 1)) * 10) / 10;
}

export type SessionInterval = { type: 'run' | 'walk'; label: string; duration: number };

/**
 * Builds the ordered interval list for a single training session.
 * `runTargetMin` is the pure running target for that day; the returned session
 * adds warm-up + walk breaks + cool-down around it. Shared by the plan
 * generator (for the displayed total) and the live tracker.
 */
export function buildSessionIntervals(
  runTargetMin: number,
  week: number,
  method: string,
): SessionInterval[] {
  const runTargetSec = Math.max(runTargetMin, method === 'Método Caco' ? 6 : 10) * 60;

  if (method !== 'Método Caco') {
    return [{ type: 'run', label: 'Trotar', duration: Math.max(runTargetSec, 600) }];
  }

  let runSecs = 60;
  let walkSecs = 90;
  if (week >= 9) { runSecs = 300; walkSecs = 60; }
  else if (week >= 7) { runSecs = 240; walkSecs = 60; }
  else if (week >= 5) { runSecs = 180; walkSecs = 90; }
  else if (week >= 3) { runSecs = 120; walkSecs = 90; }

  const warmup = 180;
  const cooldown = 180;
  const reps = Math.max(2, Math.ceil(runTargetSec / runSecs));

  const out: SessionInterval[] = [{ type: 'walk', label: 'Calentamiento', duration: warmup }];
  for (let i = 0; i < reps; i++) {
    out.push({ type: 'run', label: 'Trotar', duration: runSecs });
    if (i < reps - 1) out.push({ type: 'walk', label: 'Descanso', duration: walkSecs });
  }
  out.push({ type: 'walk', label: 'Enfriamiento', duration: cooldown });
  return out;
}

/** Full session length in minutes (warm-up + intervals + cool-down), min 15. */
export function estimateSessionMinutes(runTargetMin: number, week: number, method: string): number {
  const total = buildSessionIntervals(runTargetMin, week, method).reduce((s, i) => s + i.duration, 0);
  return Math.max(15, Math.round(total / 60));
}

export function generatePlan(
  goal: Goal,
  goalMode: GoalMode,
  level: LevelTime | LevelDistance,
  selectedDays: DayKey[],
  targetDate: string,
): TrainingPlan {
  const target = new Date(targetDate);
  const now = new Date();
  const diffMs = target.getTime() - now.getTime();
  const diffWeeks = Math.max(4, Math.min(16, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7))));
  const totalWeeks = diffWeeks;
  const daysPerWeek = selectedDays.length;
  const method = getMethod(level);

  // Sort selected days in calendar order
  const sortedDays = [...selectedDays].sort(
    (a, b) => ALL_DAYS.indexOf(a) - ALL_DAYS.indexOf(b),
  );

  const weeks: WeekPlan[] = [];

  for (let w = 1; w <= totalWeeks; w++) {
    const weekDays: DayActivity[] = ALL_DAYS.map((day) => {
      const isTrainingDay = sortedDays.includes(day);
      if (!isTrainingDay) {
        return {
          day,
          dayShort: DAY_SHORTS[day],
          type: 'rest' as ActivityType,
        };
      }

      if (goalMode === 'time') {
        const runTargetMin = getBaseRunDuration(w, goalMode, goal);
        return {
          day,
          dayShort: DAY_SHORTS[day],
          type: 'run' as ActivityType,
          runTargetMin,
          duration: estimateSessionMinutes(runTargetMin, w, method),
        };
      } else {
        const distance = getBaseRunDistance(w, goal);
        const runTargetMin = Math.round(distance * 6.5);
        return {
          day,
          dayShort: DAY_SHORTS[day],
          type: 'run' as ActivityType,
          runTargetMin,
          duration: estimateSessionMinutes(runTargetMin, w, method),
          distance,
        };
      }
    });

    weeks.push({ week: w, days: weekDays });
  }

  return {
    goal,
    goalMode,
    level,
    targetDate,
    totalWeeks,
    daysPerWeek,
    method,
    weeks,
    createdAt: new Date().toISOString(),
  };
}

export function getGoalLabel(goal: Goal): string {
  const labels: Record<Goal, string> = {
    '20min': 'Correr 20 minutos seguidos',
    '5K': 'Correr 5K',
    '30min': 'Correr 30 minutos seguidos',
    '10K': 'Correr 10K',
    '1hour': 'Correr 1 hora seguida',
    '21K': 'Correr 21K',
    '42K': 'Correr 42K',
  };
  return labels[goal];
}

export function getGoalShortLabel(goal: Goal): string {
  const labels: Record<Goal, string> = {
    '20min': '20 min seguidos',
    '5K': 'Correr 5K',
    '30min': '30 min seguidos',
    '10K': 'Correr 10K',
    '1hour': '1 hora seguida',
    '21K': 'Correr 21K',
    '42K': 'Correr 42K',
  };
  return labels[goal];
}

/** "Listo" / "Lista" based on the given name (heuristic: first token ending in 'a' → feminine). */
export function greetingReady(name?: string): string {
  const first = (name ?? '').trim().split(/\s+/)[0].toLowerCase();
  return first.endsWith('a') ? 'Lista' : 'Listo';
}

export function formatTargetDate(isoDate: string): string {
  const date = new Date(isoDate);
  const months = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
  ];
  return `${date.getDate()} de ${months[date.getMonth()]}`;
}

export function weeksUntil(isoDate: string): number {
  const target = new Date(isoDate);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24 * 7)));
}

export function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60);
  const secs = secondsPerKm % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
