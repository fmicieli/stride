import React, { createContext, useContext, useState } from 'react';
import { Goal, GoalMode, LevelTime, LevelDistance, DayKey, OnboardingData, TrainingPlan } from '../types';

interface OnboardingContextType {
  data: OnboardingData;
  pendingPlan: TrainingPlan | null;
  setGoal: (goal: Goal, mode: GoalMode) => void;
  setLevel: (level: LevelTime | LevelDistance) => void;
  setDays: (days: DayKey[]) => void;
  setTargetDate: (date: string) => void;
  setPendingPlan: (plan: TrainingPlan | null) => void;
  reset: () => void;
}

const defaultData: OnboardingData = {
  goal: null,
  goalMode: null,
  level: null,
  days: [],
  targetDate: null,
};

const OnboardingContext = createContext<OnboardingContextType>({
  data: defaultData,
  pendingPlan: null,
  setGoal: () => {},
  setLevel: () => {},
  setDays: () => {},
  setTargetDate: () => {},
  setPendingPlan: () => {},
  reset: () => {},
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [pendingPlan, setPendingPlanState] = useState<TrainingPlan | null>(null);

  const setGoal = (goal: Goal, mode: GoalMode) =>
    setData((d) => ({ ...d, goal, goalMode: mode }));

  const setLevel = (level: LevelTime | LevelDistance) =>
    setData((d) => ({ ...d, level }));

  const setDays = (days: DayKey[]) => setData((d) => ({ ...d, days }));

  const setTargetDate = (targetDate: string) =>
    setData((d) => ({ ...d, targetDate }));

  const setPendingPlan = (plan: TrainingPlan | null) => setPendingPlanState(plan);

  const reset = () => {
    setData(defaultData);
    setPendingPlanState(null);
  };

  return (
    <OnboardingContext.Provider value={{ data, pendingPlan, setGoal, setLevel, setDays, setTargetDate, setPendingPlan, reset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
