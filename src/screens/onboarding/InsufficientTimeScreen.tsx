import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useOnboarding } from '../../utils/onboardingContext';
import { getGoalShortLabel } from '../../utils/planGenerator';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
import { colors, spacing } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'InsufficientTime'>;

const MIN_WEEKS: Record<string, number> = {
  '20min': 4, '5K': 4, '30min': 6, '10K': 8, '1hour': 8, '21K': 12, '42K': 16,
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
        <Icon name="chevron-left" size={24} color={colors.ink[900]} />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>!</Text>
        </View>
        <Text style={styles.title}>El tiempo no es suficiente</Text>
        <Text style={styles.body}>
          {'Para lograr tu meta de '}
          <Text style={styles.bold}>{goalLabel}</Text>
          {' necesitás al menos '}
          <Text style={styles.bold}>{minWeeks} semanas</Text>
          {'.\nElegí una fecha más lejana para armar un plan realista.'}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Cambiar fecha" onPress={() => navigation.goBack()} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  backBtn: { paddingHorizontal: spacing[4], paddingTop: spacing[2], width: 48 },
  content: { flexGrow: 1, paddingHorizontal: spacing[4], paddingBottom: spacing[4], alignItems: 'center', justifyContent: 'center', gap: spacing[5] },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.warning.bg, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  iconText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 28, color: colors.warning.text },
  title: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 24, color: colors.ink[900], textAlign: 'center' },
  body: { fontFamily: 'PlusJakartaSans', fontSize: 16, color: colors.ink[500], textAlign: 'center', lineHeight: 24 },
  bold: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.ink[900] },
  footer: { paddingHorizontal: spacing[4], paddingBottom: spacing[4], paddingTop: spacing[3] },
});
