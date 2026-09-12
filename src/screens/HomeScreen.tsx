import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { getPlan, getSessions } from '../services/firestore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { TrainingPlan, TrainingSession } from '../types';
import { Button } from '../components/Button';
import { BottomSheet } from '../components/BottomSheet';
import { DarkGlassBackground } from '../components/DarkGlassBackground';
import { GlassCard } from '../components/GlassCard';
import { ProgressRing } from '../components/ProgressRing';
import { FadeInUp } from '../components/FadeInUp';
import { Icon } from '../components/Icon';
import { dg } from '../components/darkGlassTokens';
import { greetingReady, buildSessionIntervals, SessionInterval } from '../utils/planGenerator';
import { getStreakFromSessions, getWeeklyMinutes } from '../utils/stats';
import { pendingRun } from '../storage/storage';
import { primeVoice } from '../utils/voice';
import { spacing } from '../theme';

type Nav = StackNavigationProp<RootStackParamList>;

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORTS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

type PreRunStep = { title: string; detail: string };

const stepMins = (secs: number) => `${Math.max(1, Math.round(secs / 60))} min`;

/**
 * Collapses the flat interval list into pre-run timeline rows: warm-up,
 * then consecutive identical run/walk reps grouped as "N intervalos", then cool-down.
 */
function buildPreRunSteps(intervals: SessionInterval[]): PreRunStep[] {
  if (intervals.length === 0) return [];
  if (intervals.length === 1) {
    return [{ title: 'Trote continuo', detail: stepMins(intervals[0].duration) }];
  }

  const steps: PreRunStep[] = [];

  const first = intervals[0];
  if (first.label === 'Calentamiento') {
    steps.push({ title: 'Calentamiento', detail: `${stepMins(first.duration)} caminando` });
  }

  // One "unit" = a run plus its following walk break (the last rep has no break).
  const units: { run: number; walk: number | null }[] = [];
  for (let i = 0; i < intervals.length; i++) {
    if (intervals[i].type !== 'run') continue;
    const next = intervals[i + 1];
    units.push({ run: intervals[i].duration, walk: next && next.label === 'Caminata' ? next.duration : null });
  }

  // Group consecutive units that share the same run duration.
  let g = 0;
  while (g < units.length) {
    const runDur = units[g].run;
    let count = 0;
    let walkDur: number | null = null;
    while (g + count < units.length && units[g + count].run === runDur) {
      if (walkDur == null && units[g + count].walk != null) walkDur = units[g + count].walk;
      count += 1;
    }
    steps.push({
      title: count === 1 ? '1 intervalo' : `${count} intervalos`,
      detail:
        walkDur != null
          ? `${stepMins(runDur)} trote / ${stepMins(walkDur)} caminata`
          : `${stepMins(runDur)} trote`,
    });
    g += count;
  }

  const last = intervals[intervals.length - 1];
  if (last.label === 'Enfriamiento') {
    steps.push({ title: 'Enfriamiento', detail: `${stepMins(last.duration)} caminando` });
  }

  return steps;
}

function getTodayActivity(plan: TrainingPlan) {
  const todayName = DAY_NAMES[new Date().getDay()];
  return plan.weeks[0]?.days.find((d) => d.day === todayName);
}

function getNextDays(plan: TrainingPlan) {
  const today = new Date().getDay();
  const currentWeek = plan.weeks[0];
  return Array.from({ length: 4 }, (_, i) => {
    const dayIndex = (today + i) % 7;
    const dayName = DAY_NAMES[dayIndex];
    const activity = currentWeek?.days.find((d) => d.day === dayName);
    return {
      label: i === 0 ? 'Hoy' : DAY_SHORTS[dayIndex],
      isRun: activity?.type === 'run',
      isToday: i === 0,
    };
  });
}

function getCompletedWeeks(plan: TrainingPlan, sessions: TrainingSession[]): number {
  let completed = 0;
  for (const week of plan.weeks) {
    const runDays = week.days.filter((d) => d.type === 'run').length;
    if (sessions.filter((s) => s.week === week.week && s.completed).length >= runDays) completed++;
    else break;
  }
  return completed;
}

function DayChip({ label, isRun, isToday }: { label: string; isRun: boolean; isToday: boolean }) {
  return (
    <View style={[styles.dayChip, isToday && styles.dayChipToday]}>
      <View style={styles.dayChipTop}>
        <Text style={[styles.dayChipLabel, isToday && styles.dayChipLabelToday]}>{label.toUpperCase()}</Text>
        <View style={[styles.dayChipIconWrap, isRun ? styles.dayChipIconRun : styles.dayChipIconRest]}>
          <Icon name={isRun ? 'run' : 'moon'} size={10} color={isRun ? dg.accent : dg.ink500} />
        </View>
      </View>
      <Text style={[styles.dayChipType, isRun ? styles.dayChipTypeRun : styles.dayChipTypeRest]}>
        {isRun ? 'Trote' : 'Descanso'}
      </Text>
    </View>
  );
}

export function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { user, profile } = useAuth();
  const { isConnected } = useNetworkStatus();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPreRun, setShowPreRun] = useState(false);
  const [hasPendingRun, setHasPendingRun] = useState(false);
  const didRedirect = React.useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      pendingRun.get(user.uid).then((pr) => setHasPendingRun(!!pr));
      (async () => {
        try {
          const [p, s] = await Promise.all([getPlan(user.uid), getSessions(user.uid)]);
          setPlan(p);
          setSessions(s ?? []);
          if (!p && !didRedirect.current) {
            didRedirect.current = true;
            navigation.navigate('OnboardingGoal');
          }
        } catch {
          if (!didRedirect.current) { didRedirect.current = true; navigation.navigate('OnboardingGoal'); }
        } finally { setLoading(false); }
      })();
    }, [user]),
  );

  const displayName = profile?.name || 'Runner';
  const initial = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <View style={styles.root}>
        <DarkGlassBackground glow="topRight" glowSize={280} glowOpacity={0.2} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.center}><ActivityIndicator color={dg.accent} /></View>
        </SafeAreaView>
      </View>
    );
  }

  const todayActivity = plan ? getTodayActivity(plan) : null;
  const nextDays = plan ? getNextDays(plan) : [];
  const completedWeeks = plan ? getCompletedWeeks(plan, sessions) : 0;
  const progress = plan ? completedWeeks / plan.totalWeeks : 0;
  const isRunDay = todayActivity?.type === 'run';
  const streak = getStreakFromSessions(sessions);
  const weeklyMinutes = getWeeklyMinutes(sessions);
  const preRunSteps =
    isRunDay && plan
      ? buildPreRunSteps(
          buildSessionIntervals(
            todayActivity?.runTargetMin ?? todayActivity?.duration ?? 20,
            plan.weeks[0]?.week ?? 1,
            plan.method,
          ),
        )
      : [];

  return (
    <View style={styles.root}>
      <DarkGlassBackground glow="topRight" glowSize={280} glowOpacity={0.2} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        {!isConnected && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>Sin conexión — los datos pueden estar desactualizados</Text>
          </View>
        )}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.headerRow}>
            <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('MainTabs', { screen: 'Perfil' } as never)} activeOpacity={0.7}>
              <Text style={styles.avatarText}>{initial}</Text>
            </TouchableOpacity>
            <View style={styles.headerText}>
              <Text style={styles.headerHola}>Hola, {displayName}</Text>
              <Text style={styles.headerSub}>
                {isRunDay ? `¿${greetingReady(profile?.name)} para hoy?` : 'Hoy toca descansar'}
              </Text>
            </View>
            {streak > 0 && (
              <View style={styles.rachaChip}>
                <Icon name="flame" size={13} color={dg.accent} />
                <Text style={styles.rachaText}>{streak}</Text>
              </View>
            )}
          </View>

          {plan ? (
            <>
              <FadeInUp>
              <GlassCard variant="primary" style={styles.heroCard}>
                {isRunDay ? (
                  <View style={styles.heroHead}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>Entrenamiento de hoy</Text>
                    </View>
                    <Text style={styles.heroTitle}>Trote con intervalos</Text>
                    <Text style={styles.heroSub}>
                      {todayActivity?.duration} min · {plan.method.toLowerCase()}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.heroHead}>
                    <View style={styles.restRow}>
                      <Text style={styles.heroLabel}>Sin entrenamiento asignado</Text>
                      <View style={styles.restBadge}><Text style={styles.restBadgeText}>Descanso</Text></View>
                    </View>
                    <Text style={styles.restBody}>
                      El descanso también es parte del plan — así el cuerpo asimila el esfuerzo. Mañana volvés con todo.
                    </Text>
                  </View>
                )}

                <View style={styles.hairline} />

                <View style={styles.progressRow}>
                  <ProgressRing
                    size={60}
                    strokeWidth={7}
                    progress={progress}
                    trackColor="rgba(255,255,255,0.10)"
                    arcColor={dg.accent}
                    centerLabel={`${Math.round(progress * 100)}%`}
                  />
                  <View style={styles.vDivider} />
                  <View style={styles.progressText}>
                    <Text style={styles.weekLine}>Semana {completedWeeks + 1} de {plan.totalWeeks}</Text>
                    <Text style={styles.weekSub}>{Math.round(progress * 100)}% completado</Text>
                  </View>
                </View>

                {isRunDay && (
                  <TouchableOpacity
                    style={styles.cta}
                    activeOpacity={0.85}
                    onPress={() =>
                      hasPendingRun
                        ? navigation.navigate('ActiveTraining', { resume: true })
                        : setShowPreRun(true)
                    }
                  >
                    <Text style={styles.ctaText}>{hasPendingRun ? 'Reanudar entrenamiento' : 'Empezar'}</Text>
                  </TouchableOpacity>
                )}
              </GlassCard>
              </FadeInUp>

              <FadeInUp delay={80}>
                <View style={styles.statRow}>
                  <GlassCard variant="secondary" style={styles.statCard}>
                    <View style={styles.statIconWrap}><Icon name="flame" size={16} color={dg.accent} /></View>
                    <Text style={styles.statValue}>{streak} días</Text>
                    <Text style={styles.statLabel}>RACHA ACTUAL</Text>
                  </GlassCard>
                  <GlassCard variant="secondary" style={styles.statCard}>
                    <View style={styles.statIconWrap}><Icon name="clock" size={16} color={dg.accent} /></View>
                    <Text style={styles.statValue}>{weeklyMinutes} min</Text>
                    <Text style={styles.statLabel}>TIEMPO ESTA SEMANA</Text>
                  </GlassCard>
                </View>
              </FadeInUp>

              <FadeInUp delay={150}>
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>Próximos días</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysList}>
                    {nextDays.map((d, i) => (
                      <DayChip key={i} label={d.label} isRun={d.isRun} isToday={d.isToday} />
                    ))}
                  </ScrollView>
                </View>
              </FadeInUp>
            </>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>Sin plan activo</Text>
              <Text style={styles.emptyText}>Configurá tu plan de entrenamiento para empezar</Text>
              <Button label="Activar mi plan" onPress={() => navigation.navigate('OnboardingGoal')} />
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      <BottomSheet
        visible={showPreRun}
        onClose={() => setShowPreRun(false)}
        title="Antes de arrancar"
        subtitle="Así está armado tu entrenamiento de hoy. Podés pausarlo en cualquier momento."
        scrollBody
        dark
        footer={
          <Button
            label="Empezar entrenamiento"
            dark
            onPress={() => {
              primeVoice();
              setShowPreRun(false);
              navigation.navigate('ActiveTraining');
            }}
          />
        }
      >
        {preRunSteps.map((s, i) => (
          <View key={i} style={styles.tlRow}>
            <View style={styles.tlGutter}>
              <View style={styles.tlDot} />
              {i < preRunSteps.length - 1 && <View style={styles.tlLine} />}
            </View>
            <View style={styles.tlBody}>
              <Text style={styles.tlTitle}>{s.title}</Text>
              <Text style={styles.tlDetail}>{s.detail}</Text>
            </View>
          </View>
        ))}
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0F' },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  offlineBanner: { backgroundColor: 'rgba(255,193,7,0.14)', paddingVertical: 8, paddingHorizontal: spacing[4], alignItems: 'center' },
  offlineText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: '#E3B341' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[5], paddingBottom: spacing[8], gap: spacing[7] },

  headerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  avatar: { width: 44, height: 44, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, color: dg.ink900 },
  headerText: { flex: 1, gap: 4 },
  headerHola: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: dg.ink500 },
  headerSub: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, lineHeight: 26, color: dg.ink900 },
  rachaChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7,
  },
  rachaText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: dg.ink900 },

  heroCard: { borderRadius: 20, padding: spacing[5], gap: spacing[5] },
  heroHead: { gap: 4 },
  badge: { alignSelf: 'flex-start', backgroundColor: 'rgba(143,224,90,0.16)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5, marginBottom: 6 },
  badgeText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 12, color: dg.accent },
  heroTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 22, lineHeight: 28, color: dg.ink900 },
  heroSub: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: dg.ink500 },
  heroLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: dg.ink500 },
  restRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restBadge: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  restBadgeText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 11, letterSpacing: 0.5, color: dg.ink500 },
  restBody: { fontFamily: 'PlusJakartaSans', fontSize: 15, lineHeight: 22, color: dg.ink500, marginTop: 4 },
  hairline: { height: 1, backgroundColor: 'rgba(255,255,255,0.10)' },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[4] },
  vDivider: { width: 1, height: 40, backgroundColor: 'rgba(255,255,255,0.10)' },
  progressText: { flex: 1, gap: 2 },
  weekLine: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, color: dg.ink900 },
  weekSub: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 12, color: dg.ink500 },

  cta: { height: 52, borderRadius: 999, backgroundColor: dg.accent, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  ctaText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, color: dg.ctaText },

  statRow: { flexDirection: 'row', gap: spacing[3] },
  statCard: { flex: 1, borderRadius: 16, padding: spacing[4], gap: 6 },
  statIconWrap: { width: 32, height: 32, borderRadius: 999, backgroundColor: 'rgba(143,224,90,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: dg.ink900 },
  statLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 10.5, color: dg.ink500, textTransform: 'uppercase', letterSpacing: 0.5 },

  section: { gap: spacing[3] },
  sectionLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, color: dg.ink900 },
  daysList: { gap: spacing[2], paddingRight: spacing[4] },
  dayChip: {
    minWidth: 108,
    borderRadius: 16,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  dayChipToday: { borderColor: dg.accent, borderWidth: 1.5, backgroundColor: 'rgba(143,224,90,0.08)' },
  dayChipTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  dayChipLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 11, letterSpacing: 0.5, color: dg.ink500 },
  dayChipLabelToday: { color: dg.accent },
  dayChipIconWrap: { width: 16, height: 16, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  dayChipIconRun: { backgroundColor: 'rgba(143,224,90,0.14)' },
  dayChipIconRest: { backgroundColor: 'rgba(255,255,255,0.06)' },
  dayChipType: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 15 },
  dayChipTypeRun: { color: dg.ink900 },
  dayChipTypeRest: { color: dg.ink500 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: spacing[3] },
  emptyTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, color: dg.ink900 },
  emptyText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: dg.ink500, textAlign: 'center', lineHeight: 20, marginBottom: 8 },

  tlRow: { flexDirection: 'row', gap: spacing[3] },
  tlGutter: { alignItems: 'center', width: 16 },
  tlDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#8FE05A', marginTop: 4 },
  tlLine: { flex: 1, width: 2, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 4 },
  tlBody: { flex: 1, paddingBottom: spacing[5] },
  tlTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 17, lineHeight: 22, color: '#FFFFFF' },
  tlDetail: { fontFamily: 'PlusJakartaSans', fontSize: 14, lineHeight: 20, color: '#9A9A9F', marginTop: 2 },
});
