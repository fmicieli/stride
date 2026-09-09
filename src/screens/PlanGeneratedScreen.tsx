import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Modal, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../utils/onboardingContext';
import { getPlan, deletePlan } from '../services/firestore';
import { TrainingPlan } from '../types';
import { Button } from '../components/Button';
import { Icon } from '../components/Icon';
import { ProgressSteps } from '../components/ProgressSteps';
import { colors, spacing, radius } from '../theme';

type Nav = StackNavigationProp<RootStackParamList, 'PlanGenerated'>;

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
      try { await deletePlan(user.uid); } finally { setRestarting(false); }
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
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}><ActivityIndicator color={colors.brand[500]} /></View>
      </SafeAreaView>
    );
  }
  if (!plan) return null;

  const runDays = (plan.weeks[0]?.days ?? []).filter((d) => d.type === 'run');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.appHeader}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Icon name="chevron-left" size={22} color={colors.ink[900]} />
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
        <Button label="Empezar con este plan" onPress={handleStart} />
        <Button label="Volver a empezar desde cero" variant="tertiary" onPress={() => setShowRestartModal(true)} />
      </View>

      <Modal visible={showRestartModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Segura que querés volver a empezar?</Text>
            <Text style={styles.modalText}>Tu plan actual se eliminará y tendrás que configurar uno nuevo.</Text>
            <View style={styles.modalButtons}>
              <Button
                label={restarting ? 'Eliminando...' : 'Sí, empezar de nuevo'}
                onPress={handleRestart}
                disabled={restarting}
              />
              <Button label="Cancelar" variant="ghost" onPress={() => setShowRestartModal(false)} disabled={restarting} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  appHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 60, paddingHorizontal: spacing[4] },
  backButton: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  header: { paddingHorizontal: spacing[4], paddingTop: spacing[2], paddingBottom: spacing[4], gap: spacing[2] },
  headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 28, color: colors.ink[900] },
  headerSubtitle: { fontFamily: 'PlusJakartaSans', fontSize: 15, lineHeight: 22, color: colors.ink[500] },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[6] },
  footer: { paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: spacing[4], gap: spacing[2], backgroundColor: colors.surface },

  planCard: {
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    borderRadius: radius.lg,
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[5],
  },
  hairline: { height: 1, backgroundColor: colors.borderSubtle },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[3] },
  dot: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLetter: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: colors.brand[700] },
  planRowText: { flex: 1, gap: 2 },
  planDay: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: colors.ink[900] },
  planActivity: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: colors.ink[500] },

  modalOverlay: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4] },
  modalBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing[6], width: '100%' },
  modalTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: colors.ink[900], marginBottom: 6, textAlign: 'center' },
  modalText: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[500], lineHeight: 22, marginBottom: spacing[2], textAlign: 'center' },
  modalButtons: { gap: spacing[3], marginTop: spacing[6] },
});
