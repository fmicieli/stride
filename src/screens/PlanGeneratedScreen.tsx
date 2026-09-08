import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../utils/onboardingContext';
import { getPlan, deletePlan } from '../services/firestore';
import { TrainingPlan, WeekPlan } from '../types';
import { getGoalShortLabel, formatTargetDate } from '../utils/planGenerator';
import { colors, spacing, radius, controlSize } from '../theme';

type Nav = StackNavigationProp<RootStackParamList, 'PlanGenerated'>;

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function ChevronIcon({ expanded }: { expanded: boolean }) {
  if (Platform.OS === 'web') {
    return (
      // @ts-ignore
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
        {/* @ts-ignore */}
        <path d="M 6.5 3.5 L 11.5 9 L 6.5 14.5" stroke="#777777" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    );
  }
  return <Text style={{ fontSize: 14, color: '#777777' }}>{expanded ? '∧' : '›'}</Text>;
}

function WeekCard({ week, defaultExpanded = false }: { week: WeekPlan; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);
  return (
    <View style={styles.weekCard}>
      <TouchableOpacity style={styles.weekHeader} onPress={() => setExpanded((v) => !v)} activeOpacity={0.8}>
        <Text style={styles.weekTitle}>Semana {week.week}</Text>
        <ChevronIcon expanded={expanded} />
      </TouchableOpacity>
      {expanded && (
        <View style={styles.weekDays}>
          {week.days.map((day) => (
            <View key={day.day} style={styles.dayRow}>
              <Text style={[styles.dayName, day.type === 'rest' && styles.restText]}>{day.dayShort}</Text>
              <Text style={[styles.dayActivity, day.type === 'rest' && styles.restText]}>{day.type === 'run' ? 'Trote' : 'Descanso'}</Text>
              <Text style={[styles.dayDuration, day.type === 'rest' && styles.restText]}>{day.type === 'run' && day.duration ? `${day.duration} min` : ''}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export function PlanGeneratedScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const { pendingPlan, reset: resetOnboarding } = useOnboarding();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [showRestartModal, setShowRestartModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [restarting, setRestarting] = useState(false);

  useEffect(() => {
    if (user) {
      getPlan(user.uid).then((p) => setPlan(p ?? pendingPlan)).catch(() => setPlan(pendingPlan)).finally(() => setLoading(false));
    } else if (pendingPlan) {
      setPlan(pendingPlan);
      setShowSaveModal(true);
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

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.center}><ActivityIndicator color={colors.brand[500]} /></View>
      </SafeAreaView>
    );
  }
  if (!plan) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerEyebrow}>Tu plan está listo</Text>
        <Text style={styles.headerTitle}>¡Empecemos!</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.goalCard}>
          <Text style={styles.goalLabel}>Tu meta</Text>
          <Text style={styles.goalTitle}>{getGoalShortLabel(plan.goal)}</Text>
          <Text style={styles.goalDate}>Fecha objetivo: {formatTargetDate(plan.targetDate)}</Text>
        </View>

        <View style={styles.chipsRow}>
          <Chip label={`${plan.totalWeeks} semanas`} />
          <Chip label={`${plan.daysPerWeek} días/sem`} />
          <Chip label={plan.method} />
        </View>

        <View style={styles.weeksContainer}>
          {plan.weeks.map((week, i) => <WeekCard key={week.week} week={week} defaultExpanded={i === 0} />)}
        </View>

        <View style={styles.actionButtons}>
          {user ? (
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={() => navigation.replace('MainTabs')}>
              <Text style={styles.primaryButtonText}>Empezar con este plan</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={() => setShowSaveModal(true)}>
              <Text style={styles.primaryButtonText}>Guardá tu plan</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.ghostButton} activeOpacity={0.7} onPress={() => setShowRestartModal(true)}>
            <Text style={styles.ghostButtonText}>Volver a empezar desde cero</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Modal visible={showSaveModal} transparent animationType="slide" onRequestClose={() => {}}>
        <View style={styles.sheetOverlay}>
          <View style={styles.sheet}>
            <Text style={styles.modalTitle}>Guardá tu plan</Text>
            <Text style={styles.modalText}>Necesitás una cuenta para empezar a entrenar y guardar tu progreso.</Text>
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={() => { setShowSaveModal(false); navigation.navigate('Register'); }}>
              <Text style={styles.primaryButtonText}>Crear cuenta</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.ghostButton} activeOpacity={0.7} onPress={() => { setShowSaveModal(false); navigation.navigate('Login'); }}>
              <Text style={styles.ghostButtonText}>Ya tengo cuenta. Iniciar sesión</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={showRestartModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Segura que querés volver a empezar?</Text>
            <Text style={styles.modalText}>Tu plan actual se eliminará y tendrás que configurar uno nuevo.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.primaryButton, restarting && styles.disabled]} activeOpacity={0.8} onPress={handleRestart} disabled={restarting}>
                <Text style={styles.primaryButtonText}>{restarting ? 'Eliminando...' : 'Sí, empezar de nuevo'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowRestartModal(false)} disabled={restarting}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
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
  header: { paddingHorizontal: spacing[4], paddingTop: spacing[4], paddingBottom: spacing[3], borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  headerEyebrow: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[400], marginBottom: 4 },
  headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 28, color: colors.ink[900] },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing[4], paddingTop: spacing[5], paddingBottom: spacing[10] },
  goalCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing[4], marginBottom: spacing[4] },
  goalLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: colors.ink[400], marginBottom: 6 },
  goalTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 20, color: colors.ink[900], marginBottom: 6 },
  goalDate: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500] },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: spacing[6], flexWrap: 'wrap' },
  chip: { backgroundColor: colors.surfaceMuted, borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14 },
  chipText: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[700] },
  weeksContainer: { gap: spacing[3], marginBottom: spacing[8] },
  weekCard: { backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, overflow: 'hidden' },
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing[4] },
  weekTitle: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 16, color: colors.ink[900] },
  chevron: { fontSize: 14, color: colors.ink[400] },
  weekDays: { paddingHorizontal: spacing[4], paddingBottom: spacing[3], gap: 8 },
  dayRow: { flexDirection: 'row', alignItems: 'center' },
  dayName: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 14, color: colors.ink[900], width: 36 },
  dayActivity: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[900], flex: 1 },
  dayDuration: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[900], textAlign: 'right', width: 60 },
  restText: { color: colors.ink[300] },
  actionButtons: { gap: spacing[3] },
  primaryButton: { backgroundColor: colors.brand[500], borderRadius: radius.md, height: controlSize.lg, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.surface, fontSize: 16 },
  disabled: { opacity: 0.6 },
  ghostButton: { alignItems: 'center', paddingVertical: spacing[3] },
  ghostButtonText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500], textDecorationLine: 'underline' },
  skipBtn: { alignItems: 'center', paddingVertical: spacing[2] },
  skipText: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.ink[300] },
  sheetOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, padding: spacing[6], paddingBottom: spacing[10], gap: spacing[4] },
  modalOverlay: { flex: 1, backgroundColor: colors.scrim, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4] },
  modalBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing[6], width: '100%' },
  modalTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: colors.ink[900], marginBottom: 6 },
  modalText: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[500], lineHeight: 22, marginBottom: spacing[2] },
  modalButtons: { gap: spacing[3] },
  cancelButton: { height: controlSize.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderDefault, alignItems: 'center', justifyContent: 'center' },
  cancelButtonText: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[500] },
});
