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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getPlan, getSessions } from '../../services/firestore';
import { TrainingPlan, TrainingSession, WeekPlan } from '../../types';
import { ProgressBar } from '../../components/ProgressBar';
import { formatDuration, formatPace } from '../../utils/planGenerator';

type Nav = StackNavigationProp<RootStackParamList>;

function isWeekCompleted(week: WeekPlan, sessions: TrainingSession[]): boolean {
  const runDays = week.days.filter((d) => d.type === 'run').length;
  const completedCount = sessions.filter((s) => s.week === week.week && s.completed).length;
  return runDays > 0 && completedCount >= runDays;
}

function formatSessionDate(isoDate: string): string {
  const date = new Date(isoDate);
  const months = [
    'ene', 'feb', 'mar', 'abr', 'may', 'jun',
    'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
  ];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}

function getStreakFromSessions(sessions: TrainingSession[]): number {
  if (sessions.length === 0) return 0;
  const sorted = [...sessions].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
  let streak = 0;
  let prev = new Date();
  prev.setHours(0, 0, 0, 0);

  for (const s of sorted) {
    const d = new Date(s.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((prev.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) {
      streak++;
      prev = d;
    } else {
      break;
    }
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
        .then(([p, s]) => {
          setPlan(p);
          setSessions(s);
        })
        .finally(() => setLoading(false));
    }, [user]),
  );

  const completedWeeks = plan
    ? plan.weeks.filter((w) => isWeekCompleted(w, sessions)).length
    : 0;
  const streak = getStreakFromSessions(sessions);
  const totalKm = sessions.reduce((sum, s) => sum + s.distance, 0);
  const totalTime = sessions.reduce((sum, s) => sum + s.duration, 0);
  const progress = plan ? Math.min(1, completedWeeks / plan.totalWeeks) : 0;
  const recentSessions = sessions.slice(0, 3);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color="#111111" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Tu progreso</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{completedWeeks}</Text>
              <Text style={styles.summaryLabel}>Semanas completadas</Text>
            </View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryItem}>
              <Text style={styles.summaryNumber}>{streak}</Text>
              <Text style={styles.summaryLabel}>Racha actual</Text>
            </View>
          </View>
        </View>

        {plan && (
          <View style={styles.planProgress}>
            <Text style={styles.sectionTitle}>Avance en tu plan</Text>
            <ProgressBar progress={progress} height={8} />
            <Text style={styles.planProgressLabel}>
              {completedWeeks} de {plan.totalWeeks} semanas · {Math.round(progress * 100)}%
            </Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalKm.toFixed(1)}</Text>
            <Text style={styles.statUnit}>km totales</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatDuration(totalTime)}</Text>
            <Text style={styles.statUnit}>tiempo total</Text>
          </View>
        </View>

        <View style={styles.historySection}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>Últimas sesiones</Text>
            {sessions.length > 3 && (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Historial')}
              >
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
                  <Text style={styles.sessionType}>{s.type || 'Trote'}</Text>
                  <View style={styles.sessionStatsRow}>
                    <Text style={styles.sessionStat}>{s.distance.toFixed(2)} km</Text>
                    <Text style={styles.statDot}>·</Text>
                    <Text style={styles.sessionStat}>{formatDuration(s.duration)}</Text>
                    <Text style={styles.statDot}>·</Text>
                    <Text style={styles.sessionStat}>
                      {s.pace > 0 ? formatPace(s.pace) + '/km' : '—'}
                    </Text>
                  </View>
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
    gap: 20,
  },
  summaryCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
  },
  summaryDivider: {
    width: 1,
    height: 48,
    backgroundColor: '#E0E0E0',
  },
  planProgress: {
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111111',
  },
  planProgressLabel: {
    fontSize: 12,
    color: '#888888',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
  },
  statUnit: {
    fontSize: 12,
    color: '#888888',
  },
  historySection: {
    gap: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  verTodo: {
    fontSize: 14,
    color: '#666666',
    textDecorationLine: 'underline',
  },
  sessionsList: {
    gap: 8,
  },
  sessionCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 16,
    gap: 4,
  },
  sessionDate: {
    fontSize: 12,
    color: '#888888',
  },
  sessionType: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
  },
  sessionStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  sessionStat: {
    fontSize: 14,
    color: '#666666',
  },
  statDot: {
    fontSize: 14,
    color: '#AAAAAA',
  },
  emptyHistory: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 15,
    color: '#888888',
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#AAAAAA',
  },
});
