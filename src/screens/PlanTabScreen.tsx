import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../storage/storage';
import { TrainingPlan, WeekPlan } from '../types';
import { getGoalShortLabel, formatTargetDate } from '../utils/planGenerator';

const BG = '#0D0D0F';
const CARD_BG = '#1A1A1D';
const BORDER = 'rgba(255,255,255,0.10)';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#9A9A9F';
const ACCENT = '#8FE05A';

function WeekCard({ week, defaultExpanded = false }: { week: WeekPlan; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.weekCard}>
      <TouchableOpacity style={styles.weekHeader} onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
        <Text style={styles.weekTitle}>Semana {week.week}</Text>
        <Text style={styles.chevron}>{expanded ? '∧' : '∨'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.weekDays}>
          {week.days.map((day) => (
            <View key={day.day} style={styles.dayRow}>
              <Text style={[styles.dayName, day.type === 'rest' && styles.restText]}>{day.dayShort}</Text>
              <Text style={[styles.dayActivity, day.type === 'rest' && styles.restText]}>
                {day.type === 'run' ? 'Trote con intervalos' : 'Descanso'}
              </Text>
              <Text style={[styles.dayDuration, day.type === 'rest' && styles.restText]}>
                {day.type === 'run' && day.duration ? `${day.duration} min` : ''}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function PlanTabScreen() {
  const [plan, setPlan] = useState<TrainingPlan | null>(null);

  useFocusEffect(
    useCallback(() => {
      storage.getPlan().then(setPlan);
    }, []),
  );

  if (!plan) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerSmall}>Tu plan está activo</Text>
        <Text style={styles.headerTitle}>{getGoalShortLabel(plan.goal)}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>Tu meta</Text>
          <Text style={styles.goalTitle}>{getGoalShortLabel(plan.goal)}</Text>
          <Text style={styles.goalDate}>Fecha objetivo: {formatTargetDate(plan.targetDate)}</Text>
        </View>

        <View style={styles.chipsRow}>
          {[`${plan.totalWeeks} semanas`, `${plan.daysPerWeek} días/semana`, plan.method].map((c) => (
            <View key={c} style={styles.chip}>
              <Text style={styles.chipText}>{c}</Text>
            </View>
          ))}
        </View>

        <View style={styles.weeks}>
          {plan.weeks.map((w, i) => (
            <WeekCard key={w.week} week={w} defaultExpanded={i === 0} />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  headerSmall: { fontSize: 14, color: TEXT_MUTED, marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '600', color: TEXT },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  goalCard: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 12, padding: 16, marginBottom: 16 },
  goalLabel: { fontSize: 12, color: TEXT_MUTED, marginBottom: 6 },
  goalTitle: { fontSize: 20, fontWeight: '500', color: TEXT, marginBottom: 6 },
  goalDate: { fontSize: 14, color: TEXT_MUTED },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  chip: { backgroundColor: 'rgba(143,224,90,0.12)', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  chipText: { fontSize: 14, color: ACCENT },
  weeks: { gap: 12 },
  weekCard: { backgroundColor: CARD_BG, borderWidth: 1, borderColor: BORDER, borderRadius: 12, overflow: 'hidden' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  weekTitle: { fontSize: 16, fontWeight: '500', color: TEXT },
  chevron: { fontSize: 14, color: TEXT_MUTED },
  weekDays: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  dayRow: { flexDirection: 'row', alignItems: 'center' },
  dayName: { fontSize: 14, color: TEXT, width: 36, fontWeight: '500' },
  dayActivity: { fontSize: 14, color: TEXT, flex: 1 },
  dayDuration: { fontSize: 14, color: TEXT_MUTED, textAlign: 'right', width: 60 },
  restText: { color: TEXT_MUTED },
});
