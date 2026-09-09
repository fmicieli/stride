import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { ProgressSteps } from '../../components/ProgressSteps';
import { Button } from '../../components/Button';
import { Icon } from '../../components/Icon';
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
  const minWeeks = data.goal ? (MIN_WEEKS[data.goal] ?? 4) : 4;
  const minDate = addDays(new Date(), minWeeks * 7);
  const [date, setDate] = useState<Date>(minDate);

  const weeks = weeksUntil(date.toISOString());
  const isAtMinimum = weeks <= minWeeks + 1;

  const handleContinue = () => {
    setTargetDate(date.toISOString());
    navigation.navigate('OnboardingProjection');
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
          <Icon name="chevron-left" size={22} color={colors.ink[900]} />
        </TouchableOpacity>
      </View>
      <View style={styles.progressContainer}>
        <ProgressSteps step={4} totalSteps={6} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>¿Cuándo querés lograrlo?</Text>
        <Text style={styles.subtitle}>Elegí una fecha realista para tu meta</Text>

        <View style={styles.pickerContainer}>
          {Platform.OS === 'web' ? (
            <View style={styles.webField}>
              <Text style={styles.webFieldText}>{formatDateDisplay(date)}</Text>
              <Icon name="calendar" size={20} color={colors.ink[500]} />
              {/* @ts-ignore — real input, transparent, on top of the styled field */}
              <input
                type="date"
                defaultValue={toDateString(minDate)}
                min={toDateString(minDate)}
                onChange={handleWebChange}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  margin: 0,
                  padding: 0,
                  border: 'none',
                  opacity: 0,
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                }}
              />
            </View>
          ) : (
            (() => {
              const DateTimePicker = require('@react-native-community/datetimepicker').default;
              return (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  minimumDate={minDate}
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

        {Platform.OS !== 'web' && (
          <Text style={styles.dateDisplay}>{formatDateDisplay(date)}</Text>
        )}
        <Text style={[styles.weeksInfo, isAtMinimum && styles.weeksMinimum]}>
          {isAtMinimum
            ? `Esta es la fecha más pronta posible para tu meta. No se recomienda acortar el plazo.`
            : `Eso te da ${weeks} semana${weeks !== 1 ? 's' : ''} para entrenar`}
        </Text>
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Continuar" onPress={handleContinue} disabled={weeks <= 0} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  header: { height: 60, paddingHorizontal: spacing[4], justifyContent: 'center' },
  backButton: { width: 44, height: 44, justifyContent: 'center', alignItems: 'center' },
  progressContainer: { paddingHorizontal: spacing[4], paddingBottom: spacing[1], alignItems: 'center' },
  scroll: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: spacing[4], paddingTop: spacing[5], paddingBottom: spacing[4] },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, lineHeight: 30, color: colors.ink[900], marginBottom: spacing[2] },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 15, lineHeight: 22, color: colors.ink[500], marginBottom: spacing[7] },
  pickerContainer: { width: '100%', alignSelf: 'stretch', marginVertical: spacing[4] },
  picker: { width: '100%' },
  webField: {
    width: '100%',
    height: 52,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    borderRadius: 12,
    paddingHorizontal: spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
  },
  webFieldText: { fontFamily: 'PlusJakartaSans', fontSize: 16, color: colors.ink[900] },
  dateDisplay: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 20,
    color: colors.ink[900],
    textAlign: 'center',
    marginTop: spacing[3],
    marginBottom: spacing[1],
  },
  weeksInfo: { fontFamily: 'PlusJakartaSans', fontSize: 14, lineHeight: 20, color: colors.ink[500], textAlign: 'center', marginTop: spacing[2] },
  weeksMinimum: { color: colors.warning.text },
  footer: { paddingHorizontal: spacing[4], paddingBottom: spacing[4], paddingTop: spacing[3] },
});
