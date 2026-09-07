import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getSessions, getPlan, deletePlan } from '../../services/firestore';
import { TrainingSession, TrainingPlan } from '../../types';
import { formatDuration, formatPace, getGoalShortLabel } from '../../utils/planGenerator';

type Nav = StackNavigationProp<RootStackParamList, 'TrainingCompleted'>;
type Route = RouteProp<RootStackParamList, 'TrainingCompleted'>;

function getSubtitle(plan: TrainingPlan | null): string {
  if (!plan) return '¡Gran trabajo!';
  const labels: Record<string, string> = {
    '20min': 'Vas camino a correr 20 minutos seguidos',
    '5K': 'Vas camino a tu primer 5K',
    '30min': 'Vas camino a correr 30 minutos seguidos',
    '10K': 'Vas camino a tu 10K',
    '1hour': 'Vas camino a correr una hora seguida',
    '21K': 'Vas camino a tu medio maratón',
    '42K': 'Vas camino a tu maratón',
  };
  return labels[plan.goal] ?? '¡Gran trabajo!';
}

export function TrainingCompletedScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { sessionId } = route.params;
  const { user } = useAuth();

  const [session, setSession] = useState<TrainingSession | null>(null);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (!user) return;
    Promise.all([getSessions(user.uid), getPlan(user.uid)])
      .then(([allSessions, p]) => {
        const found = allSessions.find((s) => s.id === sessionId) ?? allSessions[0];
        setSession(found ?? null);
        setSessions(allSessions);
        setPlan(p);
      })
      .finally(() => setLoading(false));
  }, [user, sessionId]);

  const totalKm = sessions.reduce((acc, s) => acc + s.distance, 0);
  const totalSecs = sessions.reduce((acc, s) => acc + s.duration, 0);
  const completedSessions = sessions.filter((s) => s.completed).length;

  const handleNewGoal = async () => {
    if (!user) return;
    setRestarting(true);
    try {
      await deletePlan(user.uid);
      navigation.navigate('OnboardingGoal');
    } finally {
      setRestarting(false);
    }
  };

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
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.trophy}>🏆</Text>
        <Text style={styles.title}>¡Lo lograste!</Text>
        <Text style={styles.subtitle}>{getSubtitle(plan)}</Text>

        {session && (
          <View style={styles.sessionCard}>
            <Text style={styles.cardTitle}>Esta sesión</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
                <Text style={styles.statLabel}>Tiempo</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{session.distance.toFixed(2)} km</Text>
                <Text style={styles.statLabel}>Distancia</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatPace(session.pace)}/km</Text>
                <Text style={styles.statLabel}>Pace</Text>
              </View>
            </View>
          </View>
        )}

        <View style={styles.sessionCard}>
          <Text style={styles.cardTitle}>Tu progreso total</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{completedSessions}</Text>
              <Text style={styles.statLabel}>Sesiones</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalKm.toFixed(1)} km</Text>
              <Text style={styles.statLabel}>Km totales</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatDuration(totalSecs)}</Text>
              <Text style={styles.statLabel}>Tiempo total</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.primaryButton, restarting && styles.buttonDisabled]}
            activeOpacity={0.8}
            onPress={handleNewGoal}
            disabled={restarting}
          >
            <Text style={styles.primaryButtonText}>
              {restarting ? 'Procesando...' : 'Elegir nuevo objetivo'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('MainTabs')}
          >
            <Text style={styles.secondaryButtonText}>Ver mi progreso</Text>
          </TouchableOpacity>
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 40,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 20,
  },
  trophy: {
    fontSize: 64,
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  sessionCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 16,
    alignSelf: 'stretch',
    gap: 16,
  },
  cardTitle: {
    fontSize: 14,
    color: '#888888',
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888888',
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: '#E0E0E0',
  },
  actionButtons: {
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 8,
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
  buttonDisabled: {
    opacity: 0.6,
  },
  secondaryButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#666666',
  },
});
