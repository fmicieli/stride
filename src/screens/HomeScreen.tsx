import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
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

type Nav = StackNavigationProp<RootStackParamList>;

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const DAY_SHORTS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

function getTodayActivity(plan: TrainingPlan) {
  const todayName = DAY_NAMES[new Date().getDay()];
  const week = plan.weeks[0];
  return week?.days.find((d) => d.day === todayName);
}

function getNextDays(plan: TrainingPlan) {
  const today = new Date().getDay();
  const currentWeek = plan.weeks[0];
  return Array.from({ length: 5 }, (_, i) => {
    const dayIndex = (today + i) % 7;
    const dayName = DAY_NAMES[dayIndex];
    const activity = currentWeek?.days.find((d) => d.day === dayName);
    return {
      label: i === 0 ? 'Hoy' : DAY_SHORTS[dayIndex],
      type: activity?.type === 'run' ? 'Trote' : 'Descanso',
      isToday: i === 0,
    };
  });
}

function getCompletedWeeks(plan: TrainingPlan, sessions: TrainingSession[]): number {
  let completed = 0;
  for (const week of plan.weeks) {
    const runDays = week.days.filter((d) => d.type === 'run').length;
    const completedThisWeek = sessions.filter((s) => s.week === week.week && s.completed).length;
    if (completedThisWeek >= runDays) completed++;
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
          if (!didRedirect.current) {
            didRedirect.current = true;
            navigation.navigate('OnboardingGoal');
          }
        } finally {
          setLoading(false);
        }
      })();
    }, [user]),
  );

  const displayName = profile?.name || 'Runner';
  const initial = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#111111" />
        </View>
      </SafeAreaView>
    );
  }

  const todayActivity = plan ? getTodayActivity(plan) : null;
  const nextDays = plan ? getNextDays(plan) : [];
  const completedWeeks = plan ? getCompletedWeeks(plan, sessions) : 0;
  const progress = plan ? completedWeeks / plan.totalWeeks : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {!isConnected && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>Señal GPS perdida — recuperando...</Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.headerHola}>Hola, {displayName}</Text>
          <Text style={styles.headerSub}>Lista para hoy?</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {plan ? (
          <>
            <View style={styles.workoutCard}>
              <Text style={styles.cardLabel}>Entrenamiento de hoy</Text>
              <Text style={styles.cardTitle}>
                {todayActivity?.type === 'run' ? 'Trote' : 'Día de descanso'}
              </Text>
              {todayActivity?.type === 'run' && (
                <Text style={styles.cardSub}>
                  {todayActivity.duration} min · {plan.method}
                </Text>
              )}
              <View style={styles.separator} />
              <ProgressBar progress={progress} height={4} />
              <View style={styles.progressLabels}>
                <Text style={styles.progressLabel}>
                  Semana {completedWeeks + 1} de {plan.totalWeeks}
                </Text>
                <Text style={styles.progressLabel}>{Math.round(progress * 100)}%</Text>
              </View>
            </View>

            {todayActivity?.type === 'run' && (
              <TouchableOpacity
                style={styles.primaryButton}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('GPSPermission')}
              >
                <Text style={styles.primaryButtonText}>Iniciar entrenamiento</Text>
              </TouchableOpacity>
            )}

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
                    <Text style={[styles.dayChipLabel, item.isToday && styles.dayChipTextActive]}>
                      {item.label}
                    </Text>
                    <Text style={[styles.dayChipType, item.isToday && styles.dayChipTextActive]}>
                      {item.type}
                    </Text>
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
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('OnboardingGoal')}
            >
              <Text style={styles.primaryButtonText}>Crear mi plan</Text>
            </TouchableOpacity>
          </View>
        )}
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
  offlineBanner: {
    backgroundColor: '#FFC107',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111111',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    gap: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F2F2F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  headerText: {
    flex: 1,
  },
  headerHola: {
    fontSize: 14,
    color: '#888888',
  },
  headerSub: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 32,
    gap: 20,
  },
  workoutCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 16,
    gap: 6,
  },
  cardLabel: {
    fontSize: 12,
    color: '#888888',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
  },
  cardSub: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 12,
    color: '#888888',
  },
  primaryButton: {
    backgroundColor: '#111111',
    borderRadius: 12,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  daysList: {
    gap: 8,
  },
  dayChip: {
    backgroundColor: '#F2F2F2',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    minWidth: 72,
  },
  dayChipActive: {
    backgroundColor: '#111111',
  },
  dayChipLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 4,
  },
  dayChipType: {
    fontSize: 13,
    fontWeight: '500',
    color: '#111111',
  },
  dayChipTextActive: {
    color: '#FFFFFF',
  },
  goalCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 16,
  },
  goalText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
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
    marginBottom: 8,
  },
});
