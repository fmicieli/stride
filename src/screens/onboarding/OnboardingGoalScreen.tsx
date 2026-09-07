import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { OptionCard } from '../../components/OptionCard';
import { useOnboarding } from '../../utils/onboardingContext';
import { Goal, GoalMode } from '../../types';

type Nav = StackNavigationProp<RootStackParamList, 'OnboardingGoal'>;

const GOAL_OPTIONS: { label: string; value: Goal; mode: GoalMode }[] = [
  { label: '20 min seguidos', value: '20min', mode: 'time' },
  { label: '5K', value: '5K', mode: 'distance' },
  { label: '30 min seguidos', value: '30min', mode: 'time' },
  { label: '10K', value: '10K', mode: 'distance' },
  { label: '1 hora seguida', value: '1hour', mode: 'time' },
  { label: '21K', value: '21K', mode: 'distance' },
  { label: '42K', value: '42K', mode: 'distance' },
];

export function OnboardingGoalScreen() {
  const navigation = useNavigation<Nav>();
  const { setGoal } = useOnboarding();
  const [selected, setSelected] = useState<Goal | null>(null);

  const handleContinue = () => {
    const option = GOAL_OPTIONS.find((o) => o.value === selected);
    if (!option) return;
    setGoal(option.value, option.mode);
    navigation.navigate('OnboardingLevel');
  };

  return (
    <OnboardingLayout
      step={1}
      totalSteps={6}
      title="¿Cuál es tu meta?"
      subtitle="Elegí el objetivo que querés lograr"
      canContinue={selected !== null}
      onContinue={handleContinue}
    >
      {GOAL_OPTIONS.map((option) => (
        <OptionCard
          key={option.value}
          label={option.label}
          selected={selected === option.value}
          onPress={() => setSelected(option.value)}
        />
      ))}
    </OnboardingLayout>
  );
}
