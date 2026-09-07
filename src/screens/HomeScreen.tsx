import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { getPlan, getSessions } from '../services/firestore';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { TrainingPlan, TrainingSession } from '../types';
import { ProgressBar } from '../components/ProgressBar';
import { getGoalShortLabel } from '../utils/planGenerator';
import { colors, spacing, radius, controlSize } from '../theme';

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
  return Array.from({ length: 5 }, (_, i) => {
    const dayIndex = (today + i) % 7;
    const dayName = DAY_NAMES[dayIndex];
    const activity = currentWeek?.days.find((d) => d.day === dayName);
    return { label: i === 0 ? 'Hoy' : DAY_SHORTS[dayIndex], type: activity?.type === 'run' ? 'Trote' : 'Descanso', isToday: i === 0 };
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

      <View style={styles.header}>
        <TouchableOpacity style={styles.avatar} onPress={() => navigation.navigate('Profile')} activeOpacity={0.7}>
          <Text style={styles.avatarText}>{initial}</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerHola}>Hola, {displayName}</Text>
          <Text style={styles.headerSub}>¿Lista para hoy?</Text>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {plan ? (
          <>
            <View style={styles.workoutCard}>
              <Text style={styles.cardLabel}>Entrenamiento de hoy</Text>
              <Text style={styles.cardTitle}>{isRunDay ? 'Trote' : 'Día de descanso'}</Text>
              {isRunDay && (
                <Text style={styles.cardSub}>{todayActivity.duration} min · {plan.method}</Text>
              )}
              <View style={styles.separator} />
              <ProgressBar progress={progress} height={4} />
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>Semana {completedWeeks + 1} de {plan.totalWeeks}</Text>
                <Text style={styles.progressLabel}>{Math.round(progress * 100)}%</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Próximos días</Text>
              <FlatList
                data={nextDays}
                horizontal
                keyExtractor={(_, i) => i.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.daysList}
                renderItem={({ item }) => (
                  <View style={[styles.dayChip, item.isToday && styles.dayChipActive]}>
                    <Text style={[styles.dayChipLabel, item.isToday && styles.dayChipTextActive]}>{item.label}</Text>
                    <Text style={[styles.dayChipType, item.isToday && styles.dayChipTextActive]}>{item.type}</Text>
                  </View>
                )}
              />
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Meta</Text>
              <View style={styles.goalCard}>
                <Text style={styles.goalText}>{getGoalShortLabel(plan.goal)}</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Sin plan activo</Text>
            <Text style={styles.emptyText}>Configurá tu plan de entrenamiento para empezar</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {plan ? (
          isRunDay ? (
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={() => navigation.navigate('GPSPermission')}>
              <Text style={styles.primaryButtonText}>Iniciar entrenamiento</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.restFooter}>
              <Text style={styles.restFooterText}>Hoy es día de descanso — ¡aprovechá para recuperarte!</Text>
            </View>
          )
        ) : (
          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={() => navigation.navigate('OnboardingGoal')}>
            <Text style={styles.primaryButtonText}>Activar mi plan</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  offlineBanner: { backgroundColor: colors.warning.bg, paddingVertical: 8, paddingHorizontal: spacing[4], alignItems: 'center' },
  offlineText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: colors.warning.text },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[4], paddingVertical: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted, gap: spacing[3] },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, color: colors.brand[600] },
  headerText: { flex: 1 },
  headerHola: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[400] },
  headerSub: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, color: colors.ink[900] },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[5], paddingBottom: spacing[4], gap: spacing[5] },
  footer: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[4], backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.surfaceMuted },
  restFooter: { alignItems: 'center', paddingVertical: spacing[3] },
  restFooterText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500], textAlign: 'center' },
  workoutCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing[4], gap: 6 },
  cardLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: colors.ink[400] },
  cardTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, color: colors.ink[900] },
  cardSub: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500], marginBottom: 4 },
  separator: { height: 1, backgroundColor: colors.borderDefault, marginVertical: 8 },
  progressLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  progressLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: colors.ink[400] },
  primaryButton: { backgroundColor: colors.brand[500], borderRadius: radius.md, height: controlSize.lg, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.surface, fontSize: 16 },
  section: { gap: spacing[3] },
  sectionTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, color: colors.ink[900] },
  daysList: { gap: 8 },
  dayChip: { backgroundColor: colors.surfaceMuted, borderRadius: radius.xs, paddingVertical: 8, paddingHorizontal: spacing[3], alignItems: 'center', minWidth: 72 },
  dayChipActive: { backgroundColor: colors.brand[500] },
  dayChipLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: colors.ink[400], marginBottom: 4 },
  dayChipType: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: colors.ink[900] },
  dayChipTextActive: { color: colors.surface },
  goalCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing[4] },
  goalText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 16, color: colors.ink[900] },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 60, gap: spacing[3] },
  emptyTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, color: colors.ink[900] },
  emptyText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500], textAlign: 'center', lineHeight: 20, marginBottom: 8 },
});
