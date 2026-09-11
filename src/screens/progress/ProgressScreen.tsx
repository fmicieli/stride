import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getPlan, getSessions } from '../../services/firestore';
import { TrainingPlan, TrainingSession, WeekPlan } from '../../types';
import { formatDuration } from '../../utils/planGenerator';
import { getStreakFromSessions, getWeekDots, DayDotState } from '../../utils/stats';
import { Icon } from '../../components/Icon';
import { DarkGlassBackground } from '../../components/DarkGlassBackground';
import { GlassCard } from '../../components/GlassCard';
import { ProgressRing } from '../../components/ProgressRing';
import { FadeInUp } from '../../components/FadeInUp';
import { dg } from '../../components/darkGlassTokens';
import { spacing } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList>;

const DAY_LETTERS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

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

function DayDot({ letter, state }: { letter: string; state: DayDotState }) {
  return (
    <View style={styles.dotCol}>
      <Text style={[styles.dotLetter, state === 'today' && styles.dotLetterToday, state === 'done' && styles.dotLetterDone]}>
        {letter}
      </Text>
      <View
        style={[
          styles.dot,
          state === 'done' && styles.dotDone,
          state === 'today' && styles.dotToday,
          state === 'future' && styles.dotFuture,
        ]}
      />
    </View>
  );
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
  const totalSessions = sessions.filter((s) => s.completed).length;
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const progress = plan ? Math.min(1, completedWeeks / plan.totalWeeks) : 0;
  const recentSessions = sessions.slice(0, 3);
  const weekDots = getWeekDots(sessions);

  if (loading) {
    return (
      <View style={styles.root}>
        <DarkGlassBackground glow="topLeft" glowSize={260} glowOpacity={0.18} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.center}><ActivityIndicator color={dg.accent} /></View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DarkGlassBackground glow="topLeft" glowSize={260} glowOpacity={0.18} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.pageHead}>
            <Text style={styles.pageTitle}>Tu progreso</Text>
            <View style={styles.trendBtn}>
              <Icon name="trend" size={18} color={dg.accent} />
            </View>
          </View>

          <FadeInUp>
            <GlassCard variant="primary" style={styles.heroCard}>
              <ProgressRing
                size={88}
                strokeWidth={8}
                progress={progress}
                trackColor={dg.track}
                arcColor={dg.accent}
                centerLabel={`${completedWeeks}/${plan?.totalWeeks ?? 0}`}
                centerSub="SEMANAS"
              />
              <View style={styles.heroDivider} />
              <View style={styles.heroRight}>
                <Text style={styles.rachaLabel}>RACHA ACTUAL</Text>
                <Text style={styles.rachaValue}>{streak} días</Text>
                <View style={styles.dotsRow}>
                  {DAY_LETTERS.map((l, i) => (
                    <DayDot key={i} letter={l} state={weekDots[i]} />
                  ))}
                </View>
              </View>
            </GlassCard>
          </FadeInUp>

          <FadeInUp delay={80}>
            <View style={styles.statGrid}>
              <GlassCard variant="secondary" style={styles.statBox}>
                <View style={styles.statIconWrap}><Icon name="route" size={16} color={dg.accent} /></View>
                <Text style={styles.statValue}>{totalSessions}</Text>
                <Text style={styles.statLabel}>ENTRENAMIENTOS</Text>
              </GlassCard>
              <GlassCard variant="secondary" style={styles.statBox}>
                <View style={styles.statIconWrap}><Icon name="clock" size={16} color={dg.accent} /></View>
                <Text style={styles.statValue}>{formatDuration(totalTime)}</Text>
                <Text style={styles.statLabel}>TIEMPO TOTAL</Text>
              </GlassCard>
            </View>
          </FadeInUp>

          <FadeInUp delay={150}>
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.sectionTitle}>Historial</Text>
                <TouchableOpacity
                  activeOpacity={0.7}
                  disabled={sessions.length === 0}
                  onPress={() => navigation.navigate('Historial')}
                >
                  <Text style={[styles.verTodo, sessions.length === 0 && styles.verTodoDisabled]}>Ver todo</Text>
                </TouchableOpacity>
              </View>

              {sessions.length === 0 ? (
                <GlassCard variant="secondary" style={styles.emptyHistory}>
                  <Text style={styles.emptyText}>Aún no completaste ningún entrenamiento</Text>
                  <Text style={styles.emptySubtext}>¡Arrancá hoy!</Text>
                </GlassCard>
              ) : (
                <View style={styles.sessionsList}>
                  {recentSessions.map((s, i) => (
                    <FadeInUp key={s.id} delay={200 + i * 50}>
                      <GlassCard variant="secondary" style={styles.sessionCard}>
                        <View style={styles.sessionIconWrap}><Icon name="run" size={17} color={dg.accent} /></View>
                        <View style={styles.sessionText}>
                          <Text style={styles.sessionDate}>{formatSessionDate(s.date)}</Text>
                          <Text style={styles.sessionType}>{s.type || 'Trote con intervalos'}</Text>
                          <Text style={styles.sessionStat}>{formatSessionMinutes(s.duration)}</Text>
                        </View>
                      </GlassCard>
                    </FadeInUp>
                  ))}
                </View>
              )}
            </View>
          </FadeInUp>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0F' },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[5], paddingBottom: spacing[10], gap: spacing[7] },
  pageHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  pageTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: dg.ink900 },
  trendBtn: { width: 36, height: 36, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  heroCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: spacing[5], gap: spacing[4] },
  heroDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.10)' },
  heroRight: { flex: 1, gap: 4 },
  rachaLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 10, color: dg.ink500, letterSpacing: 0.5 },
  rachaValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: dg.ink900 },
  dotsRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  dotCol: { alignItems: 'center', gap: 6, width: 20 },
  dotLetter: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 10, color: dg.ink300 },
  dotLetterDone: { color: dg.ink500 },
  dotLetterToday: { fontFamily: 'PlusJakartaSans-Bold', color: dg.ink900 },
  dot: { width: 10, height: 10, borderRadius: 999 },
  dotDone: { backgroundColor: dg.accent, opacity: 0.35 },
  dotToday: {
    width: 12, height: 12, borderRadius: 999, backgroundColor: dg.accent,
    shadowColor: dg.accent, shadowOpacity: 0.6, shadowRadius: 6, shadowOffset: { width: 0, height: 0 }, elevation: 4,
  },
  dotFuture: { backgroundColor: 'transparent', borderWidth: 1.3, borderColor: dg.border },

  statGrid: { flexDirection: 'row', gap: spacing[3] },
  statBox: { flex: 1, borderRadius: 16, padding: spacing[4], gap: 6 },
  statIconWrap: { width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(143,224,90,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: dg.ink900 },
  statLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 10.5, color: dg.ink500, textTransform: 'uppercase', letterSpacing: 0.5 },

  historySection: { gap: spacing[3] },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, color: dg.ink900 },
  verTodo: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: dg.accent },
  verTodoDisabled: { color: dg.ink300 },
  sessionsList: { gap: spacing[3] },
  sessionCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: spacing[4], gap: spacing[3] },
  sessionIconWrap: { width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(143,224,90,0.14)', alignItems: 'center', justifyContent: 'center' },
  sessionText: { flex: 1, gap: 2 },
  sessionDate: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: dg.ink500, letterSpacing: 0.3 },
  sessionType: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: dg.ink900 },
  sessionStat: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: dg.ink500 },
  emptyHistory: { borderRadius: 20, padding: spacing[6], alignItems: 'center', gap: 6 },
  emptyText: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: dg.ink500, textAlign: 'center' },
  emptySubtext: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: dg.ink300 },
});
