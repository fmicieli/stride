import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { useOnboarding } from '../../utils/onboardingContext';
import { DayKey } from '../../types';
import { colors, radius, borderWidth } from '../../theme';

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
    borderWidth: borderWidth.hairline,
    borderColor: colors.borderDefault,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleOn: {
    backgroundColor: colors.brand[500],
    borderColor: colors.brand[500],
  },
  letter: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: colors.ink[600] },
  letterOn: { color: colors.surface },
  counter: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 13,
    color: colors.ink[600],
    marginTop: 4,
  },
});
