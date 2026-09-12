import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../utils/onboardingContext';
import { getPlan, deletePlan } from '../services/firestore';
import { pendingRun } from '../storage/storage';
import { TrainingPlan } from '../types';
import { Button } from '../components/Button';
import { BottomSheet } from '../components/BottomSheet';
import { Icon } from '../components/Icon';
import { ProgressSteps } from '../components/ProgressSteps';
import { spacing, radius } from '../theme';

type Nav = StackNavigationProp<RootStackParamList, 'PlanGenerated'>;

const BG = '#0D0D0F';
const CARD_BG = '#1A1A1D';
const BORDER = 'rgba(255,255,255,0.10)';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#9A9A9F';
const ACCENT = '#8FE05A';

export function PlanGeneratedScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { pendingPlan, reset: resetOnboarding } = useOnboarding();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (user) {
      getPlan(user.uid).then((p) => setPlan(p ?? pendingPlan)).catch(() => setPlan(pendingPlan)).finally(() => setLoading(false));
    } else if (pendingPlan) {
      setPlan(pendingPlan);
      setLoading(false);
    }
  }, [user, pendingPlan]);

  const handleRestart = async () => {
    if (user) {
      setRestarting(true);
      try { await Promise.all([deletePlan(user.uid), pendingRun.clear()]); } finally { setRestarting(false); }
    }
    resetOnboarding();
    setShowRestartModal(false);
    navigation.navigate('OnboardingGoal');
  };

  const handleStart = () => {
    if (user) navigation.replace('MainTabs');
    else navigation.navigate('Register');
  };

  if (loading) {
    return (
      <View style={styles.root}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.center}><ActivityIndicator color={ACCENT} /></View>
        </SafeAreaView>
      </View>
    );
  }
  if (!plan) return null;

  const runDays = (plan.weeks[0]?.days ?? []).filter((d) => d.type === 'run');

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.appHeader}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Icon name="chevron-left" size={22} color={TEXT} />
          </TouchableOpacity>
          <ProgressSteps step={6} totalSteps={6} />
          <View style={styles.backButton} />
        </View>

        <View style={styles.header}>
          <Text style={styles.headerTitle}>Tu plan semanal, listo</Text>
          <Text style={styles.headerSubtitle}>
            Lo generamos automáticamente según tus respuestas. No hay otras opciones para elegir, podés ajustarlo más adelante.
          </Text>
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.planCard}>
            {runDays.map((day, i) => (
              <View key={day.day}>
                {i > 0 && <View style={styles.hairline} />}
                <View style={styles.planRow}>
                  <View style={styles.dot}>
                    <Text style={styles.dotLetter}>{(day.dayShort ?? day.day).charAt(0)}</Text>
                  </View>
                  <View style={styles.planRowText}>
                    <Text style={styles.planDay}>{day.day}</Text>
                    <Text style={styles.planActivity}>
                      Trote con intervalos{day.duration ? ` · ${day.duration} min` : ''}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label="Empezar con este plan" onPress={handleStart} dark />
          <Button label="Volver a empezar desde cero" variant="tertiary" onPress={() => setShowRestartModal(true)} dark />
        </View>

        <BottomSheet
          dark
          visible={showRestartModal}
          onClose={() => setShowRestartModal(false)}
          title="¿Segura que querés volver a empezar?"
          subtitle="Tu plan actual se eliminará y tendrás que configurar uno nuevo."
        >
          <Button label={restarting ? 'Eliminando...' : 'Sí, empezar de nuevo'} onPress={handleRestart} disabled={restarting} dark />
          <Button label="Cancelar" variant="ghost" onPress={() => setShowRestartModal(false)} disabled={restarting} dark />
        </BottomSheet>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  appHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 60, paddingHorizontal: spacing[4] },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[4], gap: spacing[2] },
  headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 28, color: TEXT },
  headerSubtitle: { fontFamily: 'PlusJakartaSans', fontSize: 15, lineHeight: 22, color: TEXT_MUTED },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[6] },
  footer: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[4], gap: spacing[2], backgroundColor: BG },

  planCard: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: radius.lg,
    backgroundColor: CARD_BG,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[5],
  },
  hairline: { height: 1, backgroundColor: 'rgba(255,255,255,0.06)' },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] },
  dot: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: 'rgba(143,224,90,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLetter: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: ACCENT },
  planRowText: { flex: 1, gap: 2 },
  planDay: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: TEXT },
  planActivity: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: TEXT_MUTED },
});
