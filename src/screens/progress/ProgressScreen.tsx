import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getPlan, getSessions } from '../../services/firestore';
import { TrainingPlan, TrainingSession, WeekPlan } from '../../types';
import { formatDuration, formatPace } from '../../utils/planGenerator';
import { Icon } from '../../components/Icon';
import { colors, spacing, radius } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList>;

function isWeekCompleted(week: WeekPlan, sessions: TrainingSession[]): boolean {
  const runDays = week.days.filter((d) => d.type === 'run').length;
  return runDays > 0 && sessions.filter((s) => s.week === week.week && s.completed).length >= runDays;
}

function formatSessionDate(isoDate: string): string {
  const date = new Date(isoDate);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

function formatSessionMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

function getStreakFromSessions(sessions: TrainingSession[]): number {
  if (sessions.length === 0) return 0;
  const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  let prev = new Date();
  prev.setHours(0, 0, 0, 0);
  for (const s of sorted) {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((prev.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) { streak++; prev = d; } else break;
  }
  return streak;
}

export function ProgressScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      Promise.all([getPlan(user.uid), getSessions(user.uid)])
        .then(([p, s]) => { setPlan(p); setSessions(s); })
        .finally(() => setLoading(false));
    }, [user]),
  );

  const completedWeeks = plan ? plan.weeks.filter((w) => isWeekCompleted(w, sessions)).length : 0;
  const streak = getStreakFromSessions(sessions);
  const totalKm = sessions.reduce((sum, s) => sum + s.distance, 0);
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const progress = plan ? Math.min(1, completedWeeks / plan.totalWeeks) : 0;
  const currentWeek = completedWeeks + 1;
  const recentSessions = sessions.slice(0, 3);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}><ActivityIndicator color={colors.brand[500]} /></View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.pageHead}>
          <Text style={styles.pageTitle}>Tu progreso</Text>
          <TouchableOpacity style={styles.trophyBtn} activeOpacity={0.7} onPress={() => navigation.navigate('Logros')}>
            <Icon name="trophy" size={20} color={colors.ink[900]} />
          </TouchableOpacity>
        </View>

        {/* SplitStat */}
        <View style={styles.splitStat}>
          <View style={styles.splitHalf}>
            <Text style={styles.splitNumber}>{completedWeeks}</Text>
            <Text style={styles.splitLabel}>Semanas completadas</Text>
          </View>
          <View style={styles.splitDivider} />
          <View style={styles.splitHalf}>
            <Text style={styles.splitNumber}>{streak}</Text>
            <Text style={styles.splitLabel}>Racha actual</Text>
          </View>
        </View>

        {/* Plan progress */}
        {plan && (
          <View style={styles.planProgress}>
            <Text style={styles.sectionTitle}>Avance en tu plan</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%` as any }]} />
            </View>
            <Text style={styles.planLabel}>Semana {currentWeek} de {plan.totalWeeks}</Text>
          </View>
        )}

        {/* StatGrid */}
        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{totalKm.toFixed(1)}</Text>
            <Text style={styles.statLabel}>Km totales</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatDuration(totalTime)}</Text>
            <Text style={styles.statLabel}>Tiempo total</Text>
          </View>
        </View>

        {/* History */}
        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Historial</Text>
            {sessions.length > 3 && (
              <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Historial')}>
                <Text style={styles.verTodo}>Ver todo</Text>
              </TouchableOpacity>
            )}
          </View>

          {sessions.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Text style={styles.emptyText}>Aún no completaste ningún entrenamiento</Text>
              <Text style={styles.emptySubtext}>¡Arrancá hoy!</Text>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              {recentSessions.map((s) => (
                <View key={s.id} style={styles.sessionCard}>
                  <Text style={styles.sessionDate}>{formatSessionDate(s.date)}</Text>
                  <Text style={styles.sessionType}>{s.type || 'Trote con intervalos'}</Text>
                  <Text style={styles.sessionStat}>
                    {s.distance.toFixed(1)} km   {formatSessionMinutes(s.duration)}
                    {s.pace > 0 ? `   ${formatPace(s.pace)} /km` : ''}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[5], paddingBottom: spacing[10], gap: spacing[3] },
  pageHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing[1] },
  pageTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: colors.ink[900] },
  trophyBtn: { width: 34, height: 34, borderRadius: 999, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  splitStat: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    paddingVertical: spacing[5],
    paddingHorizontal: spacing[5],
  },
  splitHalf: { flex: 1, gap: 4 },
  splitNumber: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: colors.ink[900] },
  splitLabel: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: colors.ink[500] },
  splitDivider: { width: 1, height: 40, backgroundColor: colors.borderDefault, marginHorizontal: spacing[4] },
  planProgress: { gap: 8 },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: colors.ink[900] },
  progressTrack: { height: 8, backgroundColor: '#ECECEC', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.brand[500], borderRadius: 4 },
  planLabel: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[500] },
  statGrid: { flexDirection: 'row', gap: spacing[3] },
  statBox: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing[4], gap: 4 },
  statValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: colors.ink[900] },
  statLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 10.5, color: colors.ink[600], textTransform: 'uppercase', letterSpacing: 0.5 },
  historySection: { gap: spacing[3] },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  verTodo: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.brand[600] },
  sessionsList: { gap: 8 },
  sessionCard: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing[4],
    gap: 4,
  },
  sessionDate: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: colors.ink[400], letterSpacing: 0.3 },
  sessionType: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: colors.ink[900] },
  sessionStat: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[400], letterSpacing: 0.3, fontVariant: ['tabular-nums'], marginTop: 2 },
  emptyHistory: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing[6], alignItems: 'center', gap: 6 },
  emptyText: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[400], textAlign: 'center' },
  emptySubtext: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[300] },
});
