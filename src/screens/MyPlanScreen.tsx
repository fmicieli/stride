import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getPlan, getSessions } from '../services/firestore';
import { TrainingPlan, TrainingSession, WeekPlan } from '../types';
import { getGoalShortLabel, formatTargetDate } from '../utils/planGenerator';
import { colors, spacing, radius } from '../theme';

function isWeekCompleted(week: WeekPlan, sessions: TrainingSession[]): boolean {
  const runDays = week.days.filter((d) => d.type === 'run').length;
  return runDays > 0 && sessions.filter((s) => s.week === week.week && s.completed).length >= runDays;
}

function getCurrentWeek(plan: TrainingPlan, sessions: TrainingSession[]): number {
  for (const week of plan.weeks) {
    if (!isWeekCompleted(week, sessions)) return week.week;
  }
  return plan.totalWeeks;
}

function CheckIcon() {
  if (Platform.OS === 'web') {
    return (
      // @ts-ignore
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* @ts-ignore */}
        <path d="M 3.5 9 L 6.5 12 L 14.5 4" stroke="#1E8563" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return <Text style={{ fontSize: 14, color: '#1E8563' }}>✓</Text>;
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  if (Platform.OS === 'web') {
    return (
      // @ts-ignore
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
        {/* @ts-ignore */}
        <path d="M 6.5 3.5 L 11.5 9 L 6.5 14.5" stroke="#777777" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return <Text style={{ fontSize: 14, color: '#777777' }}>{expanded ? '∧' : '›'}</Text>;
}

function WeekCard({ week, expanded, onToggle, completed }: { week: WeekPlan; expanded: boolean; onToggle: () => void; completed: boolean }) {
  return (
    <View style={styles.weekCard}>
      <TouchableOpacity style={styles.weekHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={styles.weekTitleRow}>
          <Text style={styles.weekTitle}>Semana {week.week}</Text>
          {completed && <CheckIcon />}
        </View>
        <ChevronIcon expanded={expanded} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.weekDays}>
          {week.days.map((day) => (
            <View key={day.day} style={styles.dayRow}>
              <Text style={[styles.dayName, day.type === 'rest' && styles.restText]}>{day.dayShort}</Text>
              <Text style={[styles.dayActivity, day.type === 'rest' && styles.restText]}>{day.type === 'run' ? 'Trote' : 'Descanso'}</Text>
              <Text style={[styles.dayDuration, day.type === 'rest' && styles.restText]}>{day.type === 'run' && day.duration ? `${day.duration} min` : ''}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function MyPlanScreen() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      Promise.all([getPlan(user.uid), getSessions(user.uid)])
        .then(([p, s]) => {
          setPlan(p);
          setSessions(s);
          if (p) setExpandedWeek(getCurrentWeek(p, s ?? []));
        })
        .finally(() => setLoading(false));
    }, [user]),
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}><ActivityIndicator color={colors.brand[500]} /></View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}><Text style={styles.headerTitle}>Mi plan</Text></View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sin plan activo</Text>
          <Text style={styles.emptyText}>Tu plan aparecerá aquí una vez que lo configures</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}><Text style={styles.headerTitle}>Mi plan</Text></View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>Tu meta</Text>
          <Text style={styles.goalTitle}>{getGoalShortLabel(plan.goal)}</Text>
          <Text style={styles.goalDate}>Fecha objetivo: {formatTargetDate(plan.targetDate)}</Text>
        </View>

        <View style={styles.chipsRow}>
          {[`${plan.totalWeeks} semanas`, `${plan.daysPerWeek} días/sem`, plan.method].map((c) => (
            <View key={c} style={styles.chip}><Text style={styles.chipText}>{c}</Text></View>
          ))}
        </View>

        <View style={styles.weeks}>
          {plan.weeks.map((week) => (
            <WeekCard
              key={week.week}
              week={week}
              expanded={expandedWeek === week.week}
              onToggle={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
              completed={isWeekCompleted(week, sessions)}
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: colors.ink[900] },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[5], paddingBottom: spacing[10] },
  goalCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing[4], marginBottom: spacing[4] },
  goalLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: colors.ink[400], marginBottom: 6 },
  goalTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, color: colors.ink[900], marginBottom: 6 },
  goalDate: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500] },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing[6], flexWrap: 'wrap' },
  chip: { backgroundColor: colors.surfaceMuted, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  chipText: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[700] },
  weeks: { gap: spacing[3] },
  weekCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, overflow: 'hidden' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing[4] },
  weekTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekTitle: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 16, color: colors.ink[900] },
  completedBadge: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: colors.brand[500] },
  weekDays: { paddingHorizontal: spacing[4], paddingBottom: spacing[3], gap: 8 },
  dayRow: { flexDirection: 'row', alignItems: 'center' },
  dayName: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, color: colors.ink[900], width: 36 },
  dayActivity: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[900], flex: 1 },
  dayDuration: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[900], textAlign: 'right', width: 60 },
  restText: { color: colors.ink[300] },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: spacing[3] },
  emptyTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, color: colors.ink[900] },
  emptyText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500], textAlign: 'center', lineHeight: 20 },
});
