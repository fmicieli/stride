import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getPlan, getSessions } from '../services/firestore';
import { TrainingPlan, TrainingSession, WeekPlan } from '../types';
import { getGoalShortLabel, formatTargetDate } from '../utils/planGenerator';
import { Icon } from '../components/Icon';
import { DarkGlassBackground } from '../components/DarkGlassBackground';
import { GlassCard } from '../components/GlassCard';
import { ProgressRing } from '../components/ProgressRing';
import { FadeInUp } from '../components/FadeInUp';
import { dg } from '../components/darkGlassTokens';
import { spacing } from '../theme';

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

const TODAY_KEY = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][new Date().getDay()];

type WeekState = 'completed' | 'current' | 'future';

function WeekCard({
  week, expanded, onToggle, state,
}: {
  week: WeekPlan; expanded: boolean; onToggle: () => void; state: WeekState;
}) {
  return (
    <GlassCard
      variant="secondary"
      style={[styles.weekCard, state === 'current' && styles.weekCardCurrent, state === 'completed' && styles.weekCardCompleted]}
    >
      <TouchableOpacity style={styles.weekHeader} onPress={onToggle} activeOpacity={0.8}>
        <View style={styles.weekTitleRow}>
          <Text style={styles.weekTitle}>Semana {week.week}</Text>
          {state === 'completed' && <Icon name="check" size={16} color={dg.accent} />}
        </View>
        <Icon name="chevron" size={16} color={dg.ink500} />
      </TouchableOpacity>
      {expanded && <View style={styles.weekHairline} />}
      {expanded && (
        <View style={styles.weekDays}>
          {week.days.map((day) => {
            const isToday = state === 'current' && day.day === TODAY_KEY;
            const isRun = day.type === 'run';
            const activity = isRun ? `Trote con intervalos${isToday ? ' · hoy' : ''}` : 'Descanso';
            return (
              <View key={day.day} style={styles.dayRow}>
                <View style={[styles.dayIconWrap, isRun ? styles.dayIconRun : styles.dayIconRest]}>
                  <Icon name={isRun ? 'run' : 'moon'} size={11} color={isRun ? dg.accent : dg.ink500} />
                </View>
                <Text style={[styles.dayName, !isRun && styles.restText, isToday && styles.todayText]}>{day.dayShort}</Text>
                <Text style={[styles.dayActivity, !isRun && styles.restText, isToday && styles.todayText]}>{activity}</Text>
                <Text style={[styles.dayDuration, !isRun && styles.restText]}>{isRun && day.duration ? `${day.duration} min` : ''}</Text>
              </View>
            );
          })}
        </View>
      )}
    </GlassCard>
  );
}

export function MyPlanScreen() {
  const navigation = useNavigation();
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
          // Default the open week to the current one; keep the user's choice on re-focus.
          if (p) setExpandedWeek((prev) => prev ?? getCurrentWeek(p, s ?? []));
        })
        .finally(() => setLoading(false));
    }, [user]),
  );

  if (loading) {
    return (
      <View style={styles.root}>
        <DarkGlassBackground glow="topRight" glowSize={260} glowOpacity={0.18} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.center}><ActivityIndicator color={dg.accent} /></View>
        </SafeAreaView>
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.root}>
        <DarkGlassBackground glow="topRight" glowSize={260} glowOpacity={0.18} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Icon name="chevron-left" size={22} color={dg.ink900} /></TouchableOpacity>
            <Text style={styles.headerTitle}>Mi plan</Text>
            <View style={styles.backBtn} />
          </View>
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sin plan activo</Text>
            <Text style={styles.emptyText}>Tu plan aparecerá aquí una vez que lo configures</Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  const currentWeek = getCurrentWeek(plan, sessions);
  const progress = Math.min(1, (currentWeek - 1) / plan.totalWeeks);
  const pct = Math.round(progress * 100);

  return (
    <View style={styles.root}>
      <DarkGlassBackground glow="topRight" glowSize={260} glowOpacity={0.18} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Icon name="chevron-left" size={22} color={dg.ink900} /></TouchableOpacity>
          <Text style={styles.headerTitle}>Mi plan</Text>
          <View style={styles.backBtn} />
        </View>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <FadeInUp>
            <GlassCard variant="primary" style={styles.goalCard}>
              <View style={styles.goalText}>
                <Text style={styles.goalLabel}>Tu meta</Text>
                <Text style={styles.goalTitle}>{getGoalShortLabel(plan.goal)}</Text>
                <Text style={styles.goalDate} numberOfLines={2}>Fecha objetivo: {formatTargetDate(plan.targetDate)}</Text>
              </View>
              <View style={styles.goalRing}>
                <ProgressRing
                  size={56}
                  strokeWidth={6}
                  progress={progress}
                  trackColor={dg.track}
                  arcColor={dg.accent}
                  centerLabel={`${currentWeek}/${plan.totalWeeks}`}
                />
              </View>
            </GlassCard>
          </FadeInUp>

          <FadeInUp delay={80}>
            <View style={styles.chipsRow}>
              <View style={styles.chip}>
                <Icon name="clock" size={13} color={dg.accent} />
                <Text style={styles.chipText}>{plan.totalWeeks} semanas</Text>
              </View>
              <View style={styles.chip}>
                <Icon name="flag" size={13} color={dg.accent} />
                <Text style={styles.chipText}>Semana {currentWeek}</Text>
              </View>
              <View style={styles.chip}>
                <Icon name="trend" size={13} color={dg.accent} />
                <Text style={styles.chipText}>{pct}% avance</Text>
              </View>
            </View>
          </FadeInUp>

          <View style={styles.weeks}>
            {plan.weeks.map((week, i) => {
              const completed = isWeekCompleted(week, sessions);
              const state: WeekState = completed ? 'completed' : week.week === currentWeek ? 'current' : 'future';
              return (
                <FadeInUp key={week.week} delay={140 + i * 50}>
                  <WeekCard
                    week={week}
                    expanded={expandedWeek === week.week}
                    onToggle={() => setExpandedWeek(expandedWeek === week.week ? null : week.week)}
                    state={state}
                  />
                </FadeInUp>
              );
            })}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0F' },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[3] },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans-Bold', fontSize: 22, color: dg.ink900 },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[10], gap: spacing[6] },

  goalCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderRadius: 20, padding: spacing[5] },
  // minWidth: 0 keeps the text column from pushing past its flex share on
  // web (react-native-web flex children default to a content-based min-width,
  // which was letting the date run under the ring instead of wrapping).
  goalText: { flex: 1, minWidth: 0, gap: 4, paddingRight: spacing[3] },
  goalRing: { flexShrink: 0 },
  goalLabel: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: dg.ink500 },
  goalTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: dg.ink900 },
  goalDate: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: dg.ink500, lineHeight: 18 },

  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999, paddingVertical: 7, paddingHorizontal: 12,
  },
  chipText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12.5, color: dg.ink900 },

  weeks: { gap: spacing[3] },
  weekCard: { borderRadius: 18, overflow: 'hidden' },
  weekCardCurrent: { borderColor: dg.accent, borderWidth: 1.5, backgroundColor: 'rgba(143,224,90,0.08)' },
  weekCardCompleted: { opacity: 0.78 },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing[5], paddingVertical: spacing[4] },
  weekTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  weekTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 17, color: dg.ink900 },
  weekHairline: { height: 1, backgroundColor: 'rgba(255,255,255,0.10)', marginHorizontal: spacing[5] },
  weekDays: { paddingHorizontal: spacing[5], paddingTop: spacing[3], paddingBottom: spacing[4], gap: 10 },
  dayRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dayIconWrap: { width: 20, height: 20, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayIconRun: { backgroundColor: 'rgba(143,224,90,0.14)' },
  dayIconRest: { backgroundColor: 'rgba(255,255,255,0.06)' },
  dayName: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: dg.ink900, width: 34 },
  dayActivity: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: dg.ink900, flex: 1 },
  dayDuration: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: dg.ink500, textAlign: 'right', width: 56 },
  restText: { color: dg.ink500 },
  todayText: { fontFamily: 'PlusJakartaSans-SemiBold', color: dg.ink900 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: spacing[3] },
  emptyTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, color: dg.ink900 },
  emptyText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: dg.ink500, textAlign: 'center', lineHeight: 20 },
});
