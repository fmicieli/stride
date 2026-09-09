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
import { ProgressBar } from '../components/ProgressBar';
import { Button } from '../components/Button';
import { greetingReady } from '../utils/planGenerator';
import { colors, spacing, radius, borderWidth } from '../theme';

type Nav = StackNavigationProp<RootStackParamList>;

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORTS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

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
  const runTone = isRun;
  return (
    <View
      style={[
        styles.dayChip,
        runTone ? styles.dayChipRun : styles.dayChipRest,
        isToday && styles.dayChipToday,
      ]}
    >
      <Text style={[styles.dayChipLabel, runTone ? styles.dayChipLabelRun : styles.dayChipLabelRest]}>
        {label.toUpperCase()}
      </Text>
      <Text style={[styles.dayChipType, runTone ? styles.dayChipTypeRun : styles.dayChipTypeRest]}>
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
  const didRedirect = React.useRef(false);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
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
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}><ActivityIndicator color={colors.brand[500]} /></View>
      </SafeAreaView>
    );
  }

  const todayActivity = plan ? getTodayActivity(plan) : null;
  const nextDays = plan ? getNextDays(plan) : [];
  const completedWeeks = plan ? getCompletedWeeks(plan, sessions) : 0;
  const progress = plan ? completedWeeks / plan.totalWeeks : 0;
  const isRunDay = todayActivity?.type === 'run';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Sin conexión — los datos pueden estar desactualizados</Text>
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('MainTabs', { screen: 'Perfil' } as never)} activeOpacity={0.7}>
            <Text style={styles.avatarText}>{initial}</Text>
          </TouchableOpacity>
          <View style={styles.headerText}>
            <Text style={styles.headerHola}>Hola, {displayName}</Text>
            <Text style={styles.headerSub}>
              {isRunDay ? `¿${greetingReady(profile?.name)} para hoy?` : 'Hoy toca descansar'}
            </Text>
          </View>
        </View>

        {plan ? (
          <>
            <View style={styles.card}>
              {isRunDay ? (
                <View style={styles.cardHead}>
                  <Text style={styles.cardLabel}>Entrenamiento de hoy</Text>
                  <Text style={styles.cardTitle}>Trote con intervalos</Text>
                  <Text style={styles.cardSub}>
                    {todayActivity?.duration} min · {plan.method.toLowerCase()}
                  </Text>
                </View>
              ) : (
                <View style={styles.cardHead}>
                  <View style={styles.restRow}>
                    <Text style={styles.cardLabel}>Sin entrenamiento asignado</Text>
                    <Text style={styles.restBadge}>Descanso</Text>
                  </View>
                  <Text style={styles.restBody}>
                    El descanso también es parte del plan — así el cuerpo asimila el esfuerzo. Mañana volvés con todo.
                  </Text>
                </View>
              )}

              <View style={styles.hairline} />

              <View style={styles.progressBlock}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressWeek}>Semana {completedWeeks + 1} de {plan.totalWeeks}</Text>
                  <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
                </View>
                <ProgressBar
                  progress={progress}
                  height={8}
                  borderRadius={radius.full}
                  backgroundColor={colors.surfaceSunken}
                />
              </View>
            </View>

            {isRunDay && (
              <Button label="Empezar" onPress={() => navigation.navigate('ActiveTraining')} />
            )}

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Próximos días</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysList}>
                {nextDays.map((d, i) => (
                  <DayChip key={i} label={d.label} isRun={d.isRun} isToday={d.isToday} />
                ))}
              </ScrollView>
            </View>
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
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  offlineBanner: { backgroundColor: colors.warning.bg, paddingVertical: 8, paddingHorizontal: spacing[4], alignItems: 'center' },
  offlineText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: colors.warning.text },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[5], paddingBottom: spacing[8], gap: spacing[5] },

  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[3] },
  avatar: { width: 44, height: 44, borderRadius: radius.full, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 18, color: colors.ink[900] },
  headerText: { flex: 1, gap: 4 },
  headerHola: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[500] },
  headerSub: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, lineHeight: 26, color: colors.ink[900] },

  card: { backgroundColor: colors.surfaceMuted, borderRadius: radius.lg, padding: spacing[5], gap: spacing[4] },
  cardHead: { gap: 4 },
  cardLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: colors.ink[500] },
  cardTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, lineHeight: 26, color: colors.ink[900] },
  cardSub: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: colors.ink[500] },
  restRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  restBadge: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 11, letterSpacing: 0.5, color: colors.ink[500] },
  restBody: { fontFamily: 'PlusJakartaSans', fontSize: 15, lineHeight: 22, color: colors.ink[600], marginTop: 4 },
  hairline: { height: 1, backgroundColor: colors.borderSubtle },
  progressBlock: { gap: spacing[2] },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  progressWeek: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: colors.ink[900] },
  progressPct: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: colors.ink[700] },

  section: { gap: spacing[2] },
  sectionLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: colors.ink[900] },
  daysList: { gap: spacing[2], paddingRight: spacing[4] },
  dayChip: {
    minWidth: 104,
    borderRadius: radius.md,
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    gap: 4,
    borderWidth: borderWidth.hairline,
  },
  dayChipRun: { backgroundColor: colors.brand[50], borderColor: colors.brand[200] },
  dayChipRest: { backgroundColor: colors.surfaceMuted, borderColor: colors.borderSubtle },
  dayChipToday: { borderColor: colors.brand[500], borderWidth: borderWidth.selected },
  dayChipLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 11, letterSpacing: 0.5 },
  dayChipLabelRun: { color: colors.brand[700] },
  dayChipLabelRest: { color: colors.ink[500] },
  dayChipType: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 15 },
  dayChipTypeRun: { color: colors.ink[900] },
  dayChipTypeRest: { color: colors.ink[500] },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: spacing[3] },
  emptyTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, color: colors.ink[900] },
  emptyText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500], textAlign: 'center', lineHeight: 20, marginBottom: 8 },
});
