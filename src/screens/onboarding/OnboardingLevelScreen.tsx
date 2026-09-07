import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { OptionCard } from '../../components/OptionCard';
import { useOnboarding } from '../../utils/onboardingContext';
import { LevelTime, LevelDistance } from '../../types';

type Nav = StackNavigationProp<RootStackParamList, 'OnboardingLevel'>;

const TIME_OPTIONS: { label: string; value: LevelTime }[] = [
  { label: 'Nunca corrí', value: 'never' },
  { label: 'Estoy empezando con intervalos (trote/caminata)', value: 'intervals' },
  { label: 'Puedo correr hasta 15 min sin parar', value: 'up15' },
  { label: 'Puedo correr entre 15 y 30 min', value: '15to30' },
  { label: 'Corro más de 30 min sin parar', value: 'over30' },
];

const DISTANCE_OPTIONS: { label: string; value: LevelDistance }[] = [
  { label: 'Nunca corrí', value: 'never' },
  { label: 'Menos de 2K', value: 'under2' },
  { label: 'Entre 2 y 5K', value: '2to5' },
  { label: 'Entre 5 y 10K', value: '5to10' },
  { label: 'Entre 10 y 15K', value: '10to15' },
  { label: 'Entre 15 y 21K', value: '15to21' },
];

export function OnboardingLevelScreen() {
  const navigation = useNavigation<Nav>();
  const { data, setLevel } = useOnboarding();
  const [selected, setSelected] = useState<LevelTime | LevelDistance | null>(null);

  const isTimeMode = data.goalMode === 'time';
  const options = isTimeMode ? TIME_OPTIONS : DISTANCE_OPTIONS;

  const handleContinue = () => {
    if (!selected) return;
    setLevel(selected);
    navigation.navigate('OnboardingDays');
  };

  return (
    <OnboardingLayout
      step={2}
      totalSteps={6}
      title="¿Cuánto corrés actualmente?"
      subtitle="Esto nos ayuda a armar un plan realista para vos"
      canContinue={selected !== null}
      onContinue={handleContinue}
    >
      {options.map((option) => (
        <OptionCard
          key={option.value}
          label={option.label}
          selected={selected === option.value}
          onPress={() => setSelected(option.value as LevelTime | LevelDistance)}
        />
      ))}
    </OnboardingLayout>
  );
}
