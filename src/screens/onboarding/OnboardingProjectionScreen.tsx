import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { OnboardingLayout } from '../../components/OnboardingLayout';
import { useOnboarding } from '../../utils/onboardingContext';
import { colors, spacing, radius, borderWidth } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'OnboardingProjection'>;

const TODAY_MIN: Record<string, number> = {
  never: 5,
  intervals: 8,
  up15: 12,
  '15to30': 20,
  over30: 30,
  under2: 8,
  '2to5': 14,
  '5to10': 20,
  '10to15': 26,
  '15to21': 32,
};

const GOAL: Record<string, { label: string; weeks: number }> = {
  '20min': { label: '20 min', weeks: 6 },
  '30min': { label: '30 min', weeks: 8 },
  '1hour': { label: '1 hora', weeks: 14 },
  '5K': { label: '5K', weeks: 8 },
  '10K': { label: '10K', weeks: 12 },
  '21K': { label: '21K', weeks: 16 },
  '42K': { label: '42K', weeks: 20 },
};

function Curve() {
  if (Platform.OS === 'web') {
    return (
      // @ts-ignore web-only SVG
      <svg width="100%" height="150" viewBox="0 0 300 150" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* @ts-ignore */}
        <style>{`
          @keyframes strideDraw { to { stroke-dashoffset: 0; } }
          @keyframes strideDotIn { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: scale(1); } }
          .stride-line { stroke-dasharray: 460; stroke-dashoffset: 460; animation: strideDraw 1100ms 150ms cubic-bezier(0.4, 0, 0.2, 1) forwards; }
          .stride-dot-end { opacity: 0; transform-box: fill-box; transform-origin: center; animation: strideDotIn 360ms 1050ms cubic-bezier(0.2, 0.9, 0.3, 1.4) forwards; }
        `}</style>
        {/* @ts-ignore */}
        <line x1="0" y1="132" x2="300" y2="132" stroke={colors.borderSubtle} strokeWidth="1" />
        {/* @ts-ignore */}
        <path className="stride-line" d="M8 124 C 96 116, 150 74, 292 20" stroke={colors.brand[500]} strokeWidth="3" strokeLinecap="round" fill="none" />
        {/* @ts-ignore */}
        <circle cx="8" cy="124" r="6" fill={colors.brand[500]} />
        {/* @ts-ignore */}
        <circle className="stride-dot-end" cx="292" cy="20" r="6" fill={colors.brand[500]} />
      </svg>
    );
  }
  return <View style={{ height: 150 }} />;
}

export function OnboardingProjectionScreen() {
  const navigation = useNavigation<Nav>();
  const { data } = useOnboarding();

  const today = (data.level && TODAY_MIN[data.level]) || 15;
  const goal = (data.goal && GOAL[data.goal]) || GOAL['5K'];

  return (
    <OnboardingLayout
      step={4}
      totalSteps={6}
      title="Así podría verse tu progreso"
      subtitle="Proyección gratuita, calculada con tus propios números — no con una tabla genérica."
      canContinue
      onContinue={() => navigation.navigate('OnboardingDate')}
    >
      <View style={styles.card}>
        <Curve />
        <View style={styles.row}>
          <Text style={styles.today}>Hoy · {today} min</Text>
          <Text style={styles.meta}>
            Meta · {goal.label} · {goal.weeks} semanas
          </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: borderWidth.hairline,
    borderColor: colors.borderDefault,
    borderRadius: radius.lg,
    padding: spacing[5],
    gap: spacing[4],
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  today: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500] },
  meta: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: colors.brand[600] },
});
