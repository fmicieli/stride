import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getSessions, getPlan } from '../../services/firestore';
import { TrainingSession, TrainingPlan } from '../../types';
import { formatDuration, formatPace, getGoalShortLabel } from '../../utils/planGenerator';
import { Button } from '../../components/Button';
import { colors, spacing, radius } from '../../theme';

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
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}><ActivityIndicator color={colors.brand[500]} /></View>
      </SafeAreaView>
    );
  }

  const CheckCircle = () => {
    if (Platform.OS === 'web') {
      return (
        <View style={styles.iconCircle}>
          {/* @ts-ignore */}
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* @ts-ignore */}
            <path d="M 6 16 L 12 22 L 26 8" stroke="#1E8563" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </View>
      );
    }
    return <View style={styles.iconCircle}><Text style={{ fontSize: 28 }}>✓</Text></View>;
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CheckCircle />
        <Text style={styles.title}>¡Entrenamiento completo!</Text>
        <Text style={styles.subtitle}>{getSubtitle(plan)}</Text>

        {session && (
          <View style={styles.statGrid}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatDuration(session.duration)}</Text>
              <Text style={styles.statLabel}>Tiempo total</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{session.distance.toFixed(2)}</Text>
              <Text style={styles.statLabel}>Distancia (km)</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatPace(session.pace)}</Text>
              <Text style={styles.statLabel}>Ritmo prom.</Text>
            </View>
          </View>
        )}

      </ScrollView>
      <View style={styles.footer}>
        <Button label="Volver a Hoy" onPress={() => navigation.navigate('MainTabs')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, paddingHorizontal: spacing[4], paddingTop: spacing[10], paddingBottom: spacing[6], alignItems: 'center', justifyContent: 'center', gap: spacing[5] },
  footer: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[4], backgroundColor: colors.surface },
  iconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.brand[50], alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: colors.ink[900], textAlign: 'center' },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 16, color: colors.ink[500], textAlign: 'center', lineHeight: 22 },
  statGrid: { flexDirection: 'row', alignSelf: 'stretch', gap: spacing[3] },
  statBox: { flex: 1, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing[4], alignItems: 'center', gap: 4 },
  statValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: colors.ink[900] },
  statLabel: { fontFamily: 'PlusJakartaSans', fontSize: 11, color: colors.ink[400], textAlign: 'center' },
});
