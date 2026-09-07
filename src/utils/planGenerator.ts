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
        const duration = getBaseRunDuration(w, goalMode, goal);
        return {
          day,
          dayShort: DAY_SHORTS[day],
          type: 'run' as ActivityType,
          duration,
        };
      } else {
        const distance = getBaseRunDistance(w, goal);
        const duration = Math.round(distance * 6.5);
        return {
          day,
          dayShort: DAY_SHORTS[day],
          type: 'run' as ActivityType,
          duration,
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
