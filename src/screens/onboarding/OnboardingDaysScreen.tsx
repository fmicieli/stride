import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { OptionCard } from '../../components/OptionCard';
import { useOnboarding } from '../../utils/onboardingContext';
import { DayKey } from '../../types';

type Nav = StackNavigationProp<RootStackParamList, 'OnboardingDays'>;

const DAYS: DayKey[] = [
  'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo',
];

export function OnboardingDaysScreen() {
  const navigation = useNavigation<Nav>();
  const { setDays } = useOnboarding();
  const [selected, setSelected] = useState<DayKey[]>([]);

  const toggle = (day: DayKey) => {
    setSelected((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  const handleContinue = () => {
    setDays(selected);
    navigation.navigate('OnboardingDate');
  };

  return (
    <OnboardingLayout
      step={3}
      totalSteps={6}
      title="¿Qué días podés entrenar?"
      subtitle="Podés elegir más de uno"
      canContinue={selected.length > 0}
      onContinue={handleContinue}
    >
      {DAYS.map((day) => (
        <OptionCard
          key={day}
          label={day}
          selected={selected.includes(day)}
          onPress={() => toggle(day)}
        />
      ))}
    </OnboardingLayout>
  );
}
