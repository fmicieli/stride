export type GoalMode = 'time' | 'distance';

export type Goal =
  | '20min'
  | '5K'
  | '30min'
  | '10K'
  | '1hour'
  | '21K'
  | '42K';

export type LevelTime =
  | 'never'
  | 'intervals'
  | 'up15'
  | '15to30'
  | 'over30';

export type LevelDistance =
  | 'never'
  | 'under2'
  | '2to5'
  | '5to10'
  | '10to15'
  | '15to21';

export type DayKey = 'Lunes' | 'Martes' | 'Miércoles' | 'Jueves' | 'Viernes' | 'Sábado' | 'Domingo';

export interface OnboardingData {
  goal: Goal | null;
  goalMode: GoalMode | null;
  level: LevelTime | LevelDistance | null;
  days: DayKey[];
  targetDate: string | null; // ISO date string
}

export type ActivityType = 'run' | 'rest';

export interface DayActivity {
  day: DayKey;
  dayShort: string;
  type: ActivityType;
  duration?: number; // minutes
  distance?: number; // km
}

export interface WeekPlan {
  week: number;
  days: DayActivity[];
}

export interface TrainingPlan {
  goal: Goal;
  goalMode: GoalMode;
  level: LevelTime | LevelDistance;
  targetDate: string;
  totalWeeks: number;
  daysPerWeek: number;
  method: string;
  weeks: WeekPlan[];
  createdAt: string;
}

export interface TrainingSession {
  id: string;
  date: string;
  type: string;
  duration: number; // seconds
  distance: number; // km
  pace: number; // seconds per km
  week: number;
  day: DayKey;
  completed: boolean;
}

export interface UserProfile {
  name: string;
  lastName: string;
  email: string;
  avatar?: string;
}

export interface AppState {
  user: UserProfile | null;
  onboarding: OnboardingData;
  plan: TrainingPlan | null;
  sessions: TrainingSession[];
  currentStreak: number;
  lastSessionDate: string | null;
}
