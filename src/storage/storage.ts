import AsyncStorage from '@react-native-async-storage/async-storage';
import { TrainingPlan, TrainingSession, UserProfile } from '../types';

const KEYS = {
  USER: '@runapp:user',
  PLAN: '@runapp:plan',
  SESSIONS: '@runapp:sessions',
  STREAK: '@runapp:streak',
  LAST_SESSION: '@runapp:last_session',
  ONBOARDING_DONE: '@runapp:onboarding_done',
};

export const storage = {
  async getUser(): Promise<UserProfile | null> {
    const val = await AsyncStorage.getItem(KEYS.USER);
    return val ? JSON.parse(val) : null;
  },
  async setUser(user: UserProfile): Promise<void> {
    await AsyncStorage.setItem(KEYS.USER, JSON.stringify(user));
  },

  async getPlan(): Promise<TrainingPlan | null> {
    const val = await AsyncStorage.getItem(KEYS.PLAN);
    return val ? JSON.parse(val) : null;
  },
  async setPlan(plan: TrainingPlan): Promise<void> {
    await AsyncStorage.setItem(KEYS.PLAN, JSON.stringify(plan));
    await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, 'true');
  },
  async clearPlan(): Promise<void> {
    await Promise.all([KEYS.PLAN, KEYS.ONBOARDING_DONE].map((k) => AsyncStorage.removeItem(k)));
  },

  async getSessions(): Promise<TrainingSession[]> {
    const val = await AsyncStorage.getItem(KEYS.SESSIONS);
    return val ? JSON.parse(val) : [];
  },
  async addSession(session: TrainingSession): Promise<void> {
    const sessions = await storage.getSessions();
    sessions.unshift(session);
    await AsyncStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
    await AsyncStorage.setItem(KEYS.LAST_SESSION, session.date);
  },

  async getStreak(): Promise<number> {
    const val = await AsyncStorage.getItem(KEYS.STREAK);
    return val ? parseInt(val, 10) : 0;
  },
  async setStreak(streak: number): Promise<void> {
    await AsyncStorage.setItem(KEYS.STREAK, streak.toString());
  },

  async getLastSessionDate(): Promise<string | null> {
    return AsyncStorage.getItem(KEYS.LAST_SESSION);
  },

  async isOnboardingDone(): Promise<boolean> {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
    return val === 'true';
  },

  async clearAll(): Promise<void> {
    await Promise.all(Object.values(KEYS).map((k) => AsyncStorage.removeItem(k)));
  },
};
