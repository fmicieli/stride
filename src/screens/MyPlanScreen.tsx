import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getPlan, getSessions } from '../services/firestore';
import { TrainingPlan, TrainingSession, WeekPlan } from '../types';
import { getGoalShortLabel, formatTargetDate } from '../utils/planGenerator';

function isWeekCompleted(week: WeekPlan, sessions: TrainingSession[]): boolean {
  const runDays = week.days.filter((d) => d.type === 'run').length;
  const completedCount = sessions.filter((s) => s.week === week.week && s.completed).length;
  return runDays > 0 && completedCount >= runDays;
}

function getCurrentWeek(plan: TrainingPlan, sessions: TrainingSession[]): number {
  for (const week of plan.weeks) {
    if (!isWeekCompleted(week, sessions)) return week.week;
  }
  return plan.totalWeeks;
}

function WeekCard({
  week,
  expanded,
  onToggle,
  completed,
}: {
  week: WeekPlan;
  expanded: boolean;
  onToggle: () => void;
  completed: boolean;
}) {
  return (
    <View style={styles.weekCard}>
      <TouchableOpacity
        style={styles.weekHeader}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <View style={styles.weekTitleRow}>
          <Text style={styles.weekTitle}>Semana {week.week}</Text>
          {completed && <Text style={styles.completedBadge}>✓</Text>}
        </View>
        <Text style={styles.chevron}>{expanded ? '∧' : '∨'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.weekDays}>
          {week.days.map((day) => (
            <View key={day.day} style={styles.dayRow}>
              <Text style={[styles.dayName, day.type === 'rest' && styles.restText]}>
                {day.dayShort}
              </Text>
              <Text style={[styles.dayActivity, day.type === 'rest' && styles.restText]}>
                {day.type === 'run' ? 'Trote' : 'Descanso'}
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
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#111111" />
        </View>
      </SafeAreaView>
    );
  }

  if (!plan) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mi plan</Text>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Sin plan activo</Text>
          <Text style={styles.emptyText}>Tu plan aparecerá aquí una vez que lo configures</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentWeek = getCurrentWeek(plan, sessions);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi plan</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>Tu meta</Text>
          <Text style={styles.goalTitle}>{getGoalShortLabel(plan.goal)}</Text>
          <Text style={styles.goalDate}>Fecha objetivo: {formatTargetDate(plan.targetDate)}</Text>
        </View>

        <View style={styles.chipsRow}>
          {[`${plan.totalWeeks} semanas`, `${plan.daysPerWeek} días/sem`, plan.method].map((c) => (
            <View key={c} style={styles.chip}>
              <Text style={styles.chipText}>{c}</Text>
            </View>
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
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  goalCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 6,
  },
  goalDate: {
    fontSize: 14,
    color: '#666666',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 13,
    color: '#111111',
  },
  weeks: {
    gap: 12,
  },
  weekCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  weekTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
  },
  completedBadge: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '700',
  },
  chevron: {
    fontSize: 14,
    color: '#888888',
  },
  weekDays: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 14,
    color: '#111111',
    width: 36,
    fontWeight: '500',
  },
  dayActivity: {
    fontSize: 14,
    color: '#111111',
    flex: 1,
  },
  dayDuration: {
    fontSize: 14,
    color: '#111111',
    textAlign: 'right',
    width: 60,
  },
  restText: {
    color: '#AAAAAA',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  emptyText: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
