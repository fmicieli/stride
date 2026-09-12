import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { useOnboarding } from '../../utils/onboardingContext';
import { DayKey } from '../../types';
import { radius } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'OnboardingDays'>;

const DAYS: { key: DayKey; letter: string }[] = [
  { key: 'Lunes', letter: 'L' },
  { key: 'Martes', letter: 'M' },
  { key: 'Miércoles', letter: 'M' },
  { key: 'Jueves', letter: 'J' },
  { key: 'Viernes', letter: 'V' },
  { key: 'Sábado', letter: 'S' },
  { key: 'Domingo', letter: 'D' },
];

const CIRCLE_BG = '#1A1A1D';
const CIRCLE_BORDER = 'rgba(255,255,255,0.10)';
const CIRCLE_SELECTED_BG = '#8FE05A';
const CIRCLE_SELECTED_BORDER = '#8FE05A';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#9A9A9F';
const TEXT_ON_ACCENT = '#0D0D0F';

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
      subtitle="Elegí los días que tengas disponibles. Podés cambiarlo más adelante."
      canContinue={selected.length > 0}
      onContinue={handleContinue}
    >
      <View style={styles.row}>
        {DAYS.map(({ key, letter }, i) => {
          const isOn = selected.includes(key);
          return (
            <TouchableOpacity
              key={i}
              activeOpacity={0.8}
              onPress={() => toggle(key)}
              style={[styles.circle, isOn && styles.circleOn]}
            >
              <Text style={[styles.letter, isOn && styles.letterOn]}>{letter}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Text style={styles.counter}>
        {selected.length === 0
          ? 'Ningún día seleccionado'
          : `${selected.length} día${selected.length === 1 ? '' : 's'} seleccionado${selected.length === 1 ? '' : 's'}`}
      </Text>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  circle: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: CIRCLE_BORDER,
    backgroundColor: CIRCLE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOn: {
    backgroundColor: CIRCLE_SELECTED_BG,
    borderColor: CIRCLE_SELECTED_BORDER,
  },
  letter: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: TEXT },
  letterOn: { color: TEXT_ON_ACCENT },
  counter: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 4,
  },
});
