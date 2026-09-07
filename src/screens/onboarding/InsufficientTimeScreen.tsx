import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useOnboarding } from '../../utils/onboardingContext';
import { getGoalShortLabel } from '../../utils/planGenerator';

type Nav = StackNavigationProp<RootStackParamList, 'InsufficientTime'>;

const MIN_WEEKS: Record<string, number> = {
  '20min': 4,
  '5K': 4,
  '30min': 6,
  '10K': 8,
  '1hour': 8,
  '21K': 12,
  '42K': 16,
};

export function InsufficientTimeScreen() {
  const navigation = useNavigation<Nav>();
  const { data } = useOnboarding();

  const goal = data.goal;
  const minWeeks = goal ? MIN_WEEKS[goal] : 4;
  const goalLabel = goal ? getGoalShortLabel(goal) : '';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backIcon}>‹</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>!</Text>
        </View>

        <Text style={styles.title}>El tiempo no es suficiente</Text>
        <Text style={styles.body}>
          Para lograr tu meta de{' '}
          <Text style={styles.bold}>{goalLabel}</Text>{' '}
          necesitás al menos{' '}
          <Text style={styles.bold}>{minWeeks} semanas</Text>.{'\n'}
          Elegí una fecha más lejana para armar un plan realista.
        </Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.primaryButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.primaryButtonText}>Cambiar fecha</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    paddingHorizontal: 16,
    paddingTop: 8,
    width: 48,
  },
  backIcon: {
    fontSize: 28,
    color: '#111111',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111111',
    textAlign: 'center',
  },
  body: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  bold: {
    fontWeight: '600',
    color: '#111111',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
  },
  primaryButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
