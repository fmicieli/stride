import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { storage } from '../storage/storage';
import { TrainingPlan, WeekPlan } from '../types';
import { getGoalShortLabel, formatTargetDate } from '../utils/planGenerator';

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
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerSmall: { fontSize: 14, color: '#888888', marginBottom: 4 },
  headerTitle: { fontSize: 24, fontWeight: '600', color: '#111111' },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 40 },
  goalCard: { backgroundColor: '#F2F2F2', borderRadius: 12, padding: 16, marginBottom: 16 },
  goalLabel: { fontSize: 12, color: '#888888', marginBottom: 6 },
  goalTitle: { fontSize: 20, fontWeight: '500', color: '#111111', marginBottom: 6 },
  goalDate: { fontSize: 14, color: '#888888' },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 24, flexWrap: 'wrap' },
  chip: { backgroundColor: '#F2F2F2', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 16 },
  chipText: { fontSize: 14, color: '#111111' },
  weeks: { gap: 12 },
  weekCard: { backgroundColor: '#F2F2F2', borderRadius: 12, overflow: 'hidden' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
  weekTitle: { fontSize: 16, fontWeight: '500', color: '#111111' },
  chevron: { fontSize: 14, color: '#888888' },
  weekDays: { paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  dayRow: { flexDirection: 'row', alignItems: 'center' },
  dayName: { fontSize: 14, color: '#111111', width: 36, fontWeight: '500' },
  dayActivity: { fontSize: 14, color: '#111111', flex: 1 },
  dayDuration: { fontSize: 14, color: '#111111', textAlign: 'right', width: 60 },
  restText: { color: '#AAAAAA' },
});
