import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getSessions, getPlan } from '../../services/firestore';
import { TrainingSession, TrainingPlan } from '../../types';
import { formatDuration, buildSessionIntervals, computeKm } from '../../utils/planGenerator';
import { DayKey } from '../../types';
import { Button } from '../../components/Button';
import { SessionSummary } from '../../components/SessionSummary';
import { spacing } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'TrainingCompleted'>;
type Route = RouteProp<RootStackParamList, 'TrainingCompleted'>;

const BG = '#0D0D0F';
const ACCENT = '#8FE05A';

const DAY_NAMES: DayKey[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([getSessions(user.uid), getPlan(user.uid)]).then(([allSessions, p]) => {
      const found = allSessions.find((s) => s.id === sessionId) ?? allSessions[0];
      setSession(found ?? null);
      setPlan(p);
    }).finally(() => setLoading(false));
  }, [user, sessionId]);

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.center}><ActivityIndicator color={ACCENT} /></View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <SessionSummary
            dark
            variant="complete"
            title="¡Entrenamiento completo!"
            subtitle={getSubtitle(plan)}
            stats={(() => {
              const dur = session?.duration ?? 0;
              const todayName = DAY_NAMES[new Date().getDay()];
              const day = plan?.weeks[0]?.days.find((d) => d.day === todayName);
              const runTarget = day?.runTargetMin ?? day?.duration ?? 20;
              const ivs = plan ? buildSessionIntervals(runTarget, plan.weeks[0]?.week ?? 1, plan.method) : [];
              const km = computeKm(dur, ivs);
              const totalKm = Math.round((km.kmRun + km.kmWalk) * 10) / 10;
              return [
                { value: formatDuration(dur), label: 'Tiempo total' },
                { value: `${totalKm} km`, label: 'Km en esta sesión' },
                { value: `${km.tramosRun} de ${km.tramosTotal}`, label: 'Intervalos compl.' },
              ];
            })()}
          />
        </ScrollView>
        <View style={styles.footer}>
          <Button label="Volver a inicio" onPress={() => navigation.navigate('MainTabs')} dark />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, paddingHorizontal: spacing[4], paddingTop: spacing[6], paddingBottom: spacing[6], alignItems: 'center', justifyContent: 'center', gap: spacing[5] },
  footer: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[4], backgroundColor: BG },
});
