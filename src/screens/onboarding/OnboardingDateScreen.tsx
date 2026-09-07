import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { ProgressSteps } from '../../components/ProgressSteps';
import { PrimaryButton } from '../../components/PrimaryButton';
import { useOnboarding } from '../../utils/onboardingContext';
import { weeksUntil } from '../../utils/planGenerator';
import { colors, spacing } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'OnboardingDate'>;

const MIN_WEEKS: Record<string, number> = {
  '20min': 4,
  '5K': 4,
  '30min': 6,
  '10K': 8,
  '1hour': 8,
  '21K': 12,
  '42K': 16,
};

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function addDays(d: Date, days: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDateDisplay(d: Date): string {
  return `${d.getDate()} de ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function OnboardingDateScreen() {
  const navigation = useNavigation<Nav>();
  const { data, setTargetDate } = useOnboarding();
  const defaultDate = addDays(new Date(), 56);
  const [date, setDate] = useState<Date>(defaultDate);

  const weeks = weeksUntil(date.toISOString());
  const minWeeks = data.goal ? (MIN_WEEKS[data.goal] ?? 4) : 4;
  const hasEnoughTime = weeks >= minWeeks;

  const handleContinue = () => {
    setTargetDate(date.toISOString());
    if (!hasEnoughTime) {
      navigation.navigate('InsufficientTime');
    } else {
      navigation.navigate('PlanLoading');
    }
  };

  const handleWebChange = (e: any) => {
    const val = e.target.value;
    if (!val) return;
    const parsed = new Date(val + 'T12:00:00');
    if (!isNaN(parsed.getTime())) setDate(parsed);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.progressContainer}>
        <ProgressSteps step={4} totalSteps={6} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>¿Cuándo querés lograrlo?</Text>
        <Text style={styles.subtitle}>Elegí una fecha realista para tu meta</Text>

        <View style={styles.pickerContainer}>
          {Platform.OS === 'web' ? (
            // @ts-ignore — web-only HTML input
            <input
              type="date"
              defaultValue={toDateString(defaultDate)}
              min={toDateString(addDays(new Date(), 1))}
              onChange={handleWebChange}
              style={{
                width: '100%',
                height: 48,
                border: '1px solid #E0E0E0',
                borderRadius: 8,
                paddingLeft: 12,
                paddingRight: 12,
                fontSize: 16,
                color: '#111111',
                backgroundColor: '#FFFFFF',
                cursor: 'pointer',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          ) : (
            (() => {
              const DateTimePicker = require('@react-native-community/datetimepicker').default;
              return (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={addDays(new Date(), 1)}
                  onChange={(_: any, selected?: Date) => {
                    if (selected) setDate(selected);
                  }}
                  locale="es-AR"
                  style={styles.picker}
                />
              );
            })()
          )}
        </View>

        {weeks > 0 ? (
          <>
            <Text style={styles.dateDisplay}>{formatDateDisplay(date)}</Text>
            <Text style={[styles.weeksInfo, !hasEnoughTime && styles.weeksWarning]}>
              {hasEnoughTime
                ? `Eso te da ${weeks} semana${weeks !== 1 ? 's' : ''} para entrenar`
                : `Necesitás al menos ${minWeeks} semanas — elegí una fecha más lejana`}
            </Text>
          </>
        ) : (
          <Text style={styles.weeksInfo}>Elegí una fecha futura</Text>
        )}
      </View>

      <View style={styles.footer}>
        <PrimaryButton
          label="Crear plan"
          onPress={handleContinue}
          disabled={weeks <= 0}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { height: 60, paddingHorizontal: spacing[4], justifyContent: 'center' },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  backIcon: { fontSize: 22, color: colors.ink[900], lineHeight: 26 },
  progressContainer: { paddingHorizontal: spacing[4], paddingBottom: spacing[1] },
  content: { flex: 1, paddingHorizontal: spacing[4], paddingTop: spacing[5] },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, lineHeight: 30, color: colors.ink[900], marginBottom: spacing[2] },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 15, lineHeight: 22, color: colors.ink[500], marginBottom: spacing[7] },
  pickerContainer: { width: '100%', marginVertical: spacing[4] },
  picker: { width: '100%' },
  dateDisplay: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 20,
    color: colors.ink[900],
    textAlign: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  weeksInfo: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[500], textAlign: 'center', marginTop: spacing[1] },
  weeksWarning: { color: colors.error.text },
  footer: { paddingHorizontal: spacing[4], paddingBottom: spacing[4], paddingTop: spacing[3] },
});
