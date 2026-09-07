import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { useOnboarding } from '../utils/onboardingContext';
import { getPlan, deletePlan } from '../services/firestore';
import { TrainingPlan, WeekPlan } from '../types';
import { getGoalShortLabel, formatTargetDate } from '../utils/planGenerator';

type Nav = StackNavigationProp<RootStackParamList, 'PlanGenerated'>;

function Chip({ label }: { label: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

function WeekCard({ week, defaultExpanded = false }: { week: WeekPlan; defaultExpanded?: boolean }) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.weekCard}>
      <TouchableOpacity
        style={styles.weekHeader}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.8}
      >
        <Text style={styles.weekTitle}>Semana {week.week}</Text>
        <Text style={styles.chevron}>{expanded ? '∧' : '∨'}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.weekDays}>
          {week.days.map((day) => (
            <View key={day.day} style={styles.dayRow}>
              <Text style={[styles.dayName, day.type === 'rest' && styles.restText]}>
                {day.dayShort}
              </Text>
              <Text style={[styles.dayActivity, day.type === 'rest' && styles.restText]}>
                {day.type === 'run' ? 'Trote' : 'Descanso'}
              </Text>
              <Text style={[styles.dayDuration, day.type === 'rest' && styles.restText]}>
                {day.type === 'run' && day.duration ? `${day.duration} min` : ''}
              </Text>
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
      getPlan(user.uid)
        .then((p) => setPlan(p ?? pendingPlan))
        .catch(() => setPlan(pendingPlan))
        .finally(() => setLoading(false));
    } else if (pendingPlan) {
      setPlan(pendingPlan);
      setShowSaveModal(true);
      setLoading(false);
    }
  }, [user, pendingPlan]);

  const handleActivate = () => {
    navigation.replace('MainTabs');
  };

  const handleRestart = async () => {
    if (user) {
      setRestarting(true);
      try {
        await deletePlan(user.uid);
      } finally {
        setRestarting(false);
      }
    }
    resetOnboarding();
    setShowRestartModal(false);
    navigation.navigate('OnboardingGoal');
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

  if (!plan) return null;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerSmall}>Tu plan está listo</Text>
        <Text style={styles.headerTitle}>¡Empecemos!</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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
          {plan.weeks.map((week, i) => (
            <WeekCard key={week.week} week={week} defaultExpanded={i === 0} />
          ))}
        </View>

        <View style={styles.actionButtons}>
          {user ? (
            <TouchableOpacity style={styles.primaryButton} activeOpacity={0.8} onPress={handleActivate}>
              <Text style={styles.primaryButtonText}>Activar mi plan</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => setShowSaveModal(true)}
            >
              <Text style={styles.primaryButtonText}>Guardá tu plan</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => setShowRestartModal(true)}
          >
            <Text style={styles.secondaryButtonText}>Volver a empezar desde cero</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal: Guardá tu plan (unauthenticated) */}
      <Modal visible={showSaveModal} transparent animationType="slide">
        <View style={styles.saveModalOverlay}>
          <View style={styles.saveModalBox}>
            <Text style={styles.saveModalTitle}>Guardá tu plan</Text>
            <Text style={styles.saveModalText}>
              Creá una cuenta para no perder tu progreso
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              activeOpacity={0.8}
              onPress={() => {
                setShowSaveModal(false);
                navigation.navigate('Register');
              }}
            >
              <Text style={styles.primaryButtonText}>Crear Cuenta</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.loginLink}
              activeOpacity={0.7}
              onPress={() => {
                setShowSaveModal(false);
                navigation.navigate('Login');
              }}
            >
              <Text style={styles.loginLinkText}>Ya tengo cuenta. Iniciar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.skipLink}
              activeOpacity={0.7}
              onPress={() => setShowSaveModal(false)}
            >
              <Text style={styles.skipLinkText}>Continuar sin guardar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal: Volver a empezar */}
      <Modal visible={showRestartModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Segura que querés volver a empezar?</Text>
            <Text style={styles.modalText}>
              Tu plan actual se eliminará y tendrás que configurar uno nuevo.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.primaryButton, restarting && styles.buttonDisabled]}
                activeOpacity={0.8}
                onPress={handleRestart}
                disabled={restarting}
              >
                <Text style={styles.primaryButtonText}>
                  {restarting ? 'Eliminando...' : 'Sí, empezar de nuevo'}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowRestartModal(false)}
                disabled={restarting}
              >
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
  headerSmall: {
    fontSize: 14,
    color: '#888888',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111111',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 40,
  },
  goalCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 12,
    color: '#888888',
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 6,
  },
  goalDate: {
    fontSize: 14,
    color: '#666666',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: '#F2F2F2',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  chipText: {
    fontSize: 13,
    color: '#111111',
  },
  weeksContainer: {
    gap: 12,
    marginBottom: 32,
  },
  weekCard: {
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    overflow: 'hidden',
  },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  weekTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111111',
  },
  chevron: {
    fontSize: 14,
    color: '#888888',
  },
  weekDays: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayName: {
    fontSize: 14,
    color: '#111111',
    width: 36,
    fontWeight: '500',
  },
  dayActivity: {
    fontSize: 14,
    color: '#111111',
    flex: 1,
  },
  dayDuration: {
    fontSize: 14,
    color: '#111111',
    textAlign: 'right',
    width: 60,
  },
  restText: {
    color: '#AAAAAA',
  },
  actionButtons: {
    gap: 12,
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
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    fontSize: 14,
    color: '#666666',
    textDecorationLine: 'underline',
  },
  saveModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  saveModalBox: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    gap: 16,
  },
  saveModalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111111',
  },
  saveModalText: {
    fontSize: 15,
    color: '#666666',
    lineHeight: 22,
  },
  loginLink: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#666666',
    textDecorationLine: 'underline',
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  skipLinkText: {
    fontSize: 13,
    color: '#AAAAAA',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111111',
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 24,
    lineHeight: 20,
  },
  modalButtons: {
    gap: 12,
  },
  cancelButton: {
    height: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    color: '#666666',
  },
});
