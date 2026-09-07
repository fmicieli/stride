import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getSessions, getPlan, deletePlan } from '../../services/firestore';
import { TrainingSession, TrainingPlan } from '../../types';
import { formatDuration, formatPace, getGoalShortLabel } from '../../utils/planGenerator';
import { colors, spacing, radius, controlSize } from '../../theme';

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
    Promise.all([getSessions(user.uid), getPlan(user.uid)]).then(([allSessions, p]) => {
      const found = allSessions.find((s) => s.id === sessionId) ?? allSessions[0];
      setSession(found ?? null);
      setSessions(allSessions);
      setPlan(p);
    }).finally(() => setLoading(false));
  }, [user, sessionId]);

  const totalKm = sessions.reduce((acc, s) => acc + s.distance, 0);
  const totalSecs = sessions.reduce((acc, s) => acc + s.duration, 0);
  const completedSessions = sessions.filter((s) => s.completed).length;

  const handleNewGoal = async () => {
    if (!user) return;
    setRestarting(true);
    try { await deletePlan(user.uid); navigation.navigate('OnboardingGoal'); }
    finally { setRestarting(false); }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}><ActivityIndicator color={colors.brand[500]} /></View>
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
          <TouchableOpacity style={[styles.primaryButton, restarting && styles.disabled]} activeOpacity={0.8} onPress={handleNewGoal} disabled={restarting}>
            <Text style={styles.primaryButtonText}>{restarting ? 'Procesando...' : 'Elegir nuevo objetivo'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7} onPress={() => navigation.navigate('MainTabs')}>
            <Text style={styles.secondaryButtonText}>Ver mi progreso</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[10], paddingBottom: spacing[10], alignItems: 'center', gap: spacing[5] },
  trophy: { fontSize: 64, marginBottom: 8 },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 32, color: colors.ink[900], textAlign: 'center' },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 16, color: colors.ink[500], textAlign: 'center', lineHeight: 22, marginBottom: 8 },
  sessionCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing[4], alignSelf: 'stretch', gap: spacing[4] },
  cardTitle: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, color: colors.ink[400] },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: colors.ink[900], marginBottom: 4 },
  statLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: colors.ink[400] },
  statDivider: { width: 1, height: 36, backgroundColor: colors.borderDefault },
  actionButtons: { alignSelf: 'stretch', gap: spacing[3], marginTop: 8 },
  primaryButton: { backgroundColor: colors.brand[500], borderRadius: radius.md, height: controlSize.lg, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.surface, fontSize: 16 },
  disabled: { opacity: 0.6 },
  secondaryButton: { height: controlSize.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderDefault, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[500] },
});
