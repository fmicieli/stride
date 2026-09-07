import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getPlan, saveSession, saveStreak, getSessions } from '../../services/firestore';
import { TrainingPlan, TrainingSession, DayKey } from '../../types';
import { ProgressBar } from '../../components/ProgressBar';
import { formatDuration, formatPace } from '../../utils/planGenerator';
import { colors, spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'ActiveTraining'>;

const DAY_NAMES: DayKey[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getDistance(a: Location.LocationObjectCoords, b: Location.LocationObjectCoords): number {
  const R = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const x = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function getGoalValue(plan: TrainingPlan): number {
  if (plan.goalMode === 'time') {
    const map: Record<string, number> = { '20min': 1200, '30min': 1800, '1hour': 3600 };
    return map[plan.goal] ?? 1200;
  }
  const map: Record<string, number> = { '5K': 5, '10K': 10, '21K': 21, '42K': 42 };
  return map[plan.goal] ?? 5;
}

function getGoalLabel(plan: TrainingPlan): string {
  const map: Record<string, string> = { '20min': '20 min', '30min': '30 min', '1hour': '1 hora', '5K': '5K', '10K': '10K', '21K': '21K', '42K': '42K' };
  return map[plan.goal] ?? plan.goal;
}

export function ActiveTrainingScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [paused, setPaused] = useState(false);
  const [goalReached, setGoalReached] = useState(false);
  const [gpsLost, setGpsLost] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSub = useRef<Location.LocationSubscription | null>(null);
  const lastPos = useRef<Location.LocationObjectCoords | null>(null);
  const pausedRef = useRef(false);
  const toastAnim = useRef(new Animated.Value(-120)).current;

  useFocusEffect(
    useCallback(() => {
      if (user) getPlan(user.uid).then(setPlan);
    }, [user]),
  );

  useEffect(() => {
    if (!plan) return;
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setElapsed((e) => e + 1);
    }, 1000);

    (async () => {
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        locationSub.current = await Location.watchPositionAsync(
          { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5, timeInterval: 2000 },
          (loc) => {
            setGpsLost(false);
            if (lastPos.current && !pausedRef.current) {
              const d = getDistance(lastPos.current, loc.coords);
              setDistance((prev) => prev + d);
            }
            lastPos.current = loc.coords;
          },
        );
      }
    })();

    const gpsTimeout = setTimeout(() => setGpsLost(true), 10000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      locationSub.current?.remove();
      clearTimeout(gpsTimeout);
    };
  }, [plan]);

  const isTimeMode = plan?.goalMode === 'time';
  const goalValue = plan ? getGoalValue(plan) : 1;
  const mainValue = isTimeMode ? elapsed : distance;
  const progress = Math.min(1, mainValue / goalValue);
  const pace = elapsed > 0 && distance > 0 ? Math.round(elapsed / distance) : 0;

  useEffect(() => {
    if (!goalReached && progress >= 1) {
      setGoalReached(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(5000),
        Animated.timing(toastAnim, { toValue: -120, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [progress]);

  const handlePause = () => {
    setPaused((p) => { pausedRef.current = !p; return !p; });
  };

  const confirmStop = async () => {
    setShowConfirm(false);
    if (timerRef.current) clearInterval(timerRef.current);
    locationSub.current?.remove();

    const sessionId = Date.now().toString();
    if (user) {
      try {
        const today = new Date();
        const todayKey = DAY_NAMES[today.getDay()];
        const session: TrainingSession = {
          id: sessionId, date: today.toISOString(), type: 'Trote',
          duration: elapsed, distance, pace,
          week: plan?.weeks[0]?.week ?? 1, day: todayKey,
          completed: elapsed > 60 || distance > 0.1,
        };
        await saveSession(user.uid, session);
        const allSessions = await getSessions(user.uid);
        await saveStreak(user.uid, allSessions.filter((s) => s.completed).length, new Date().toISOString());
      } catch { /* navigate anyway */ }
    }
    navigation.navigate('TrainingCompleted', { sessionId });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {gpsLost && (
        <View style={styles.gpsBanner}>
          <Text style={styles.gpsBannerText}>Señal GPS perdida — recuperando...</Text>
        </View>
      )}

      <Animated.View style={[styles.toast, { transform: [{ translateY: toastAnim }] }]}>
        <Text style={styles.toastTitle}>¡Meta lograda! 🎉</Text>
        <Text style={styles.toastSub}>Podés seguir corriendo o detener el entrenamiento</Text>
      </Animated.View>

      <View style={styles.header}>
        <TouchableOpacity onPress={() => setShowConfirm(true)} style={styles.closeBtn}>
          <Text style={styles.closeBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerGoal}>Meta: {plan ? getGoalLabel(plan) : '—'}</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={styles.mainValue}>{isTimeMode ? formatDuration(elapsed) : distance.toFixed(2)}</Text>
        <Text style={styles.mainLabel}>{isTimeMode ? 'tiempo' : 'distancia (km)'}</Text>

        <View style={styles.chipsRow}>
          <View style={styles.chip}>
            <Text style={styles.chipValue}>{pace > 0 ? formatPace(pace) : '--:--'}</Text>
            <Text style={styles.chipLabel}>pace /km</Text>
          </View>
          <View style={styles.chip}>
            {isTimeMode ? (
              <><Text style={styles.chipValue}>{distance.toFixed(2)}</Text><Text style={styles.chipLabel}>km</Text></>
            ) : (
              <><Text style={styles.chipValue}>{formatDuration(elapsed)}</Text><Text style={styles.chipLabel}>tiempo</Text></>
            )}
          </View>
        </View>

        <View style={styles.progressContainer}>
          <ProgressBar progress={progress} height={6} />
          <Text style={styles.progressText}>{Math.round(progress * 100)}% completado</Text>
        </View>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn} onPress={handlePause}>
          <Text style={styles.controlIcon}>{paused ? '▶' : '⏸'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setShowConfirm(true)}>
          <Text style={styles.controlIcon}>⏹</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={showConfirm} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>¿Terminar entrenamiento?</Text>
            <Text style={styles.modalText}>Se guardará tu progreso de hoy.</Text>
            <TouchableOpacity style={styles.modalPrimary} onPress={confirmStop}>
              <Text style={styles.modalPrimaryText}>Terminar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancel} onPress={() => setShowConfirm(false)}>
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#000000' },
  gpsBanner: { backgroundColor: colors.warning.bg, paddingVertical: 8, paddingHorizontal: spacing[4], alignItems: 'center' },
  gpsBannerText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: colors.warning.text },
  toast: { position: 'absolute', top: 80, left: spacing[4], right: spacing[4], backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing[4], zIndex: 100 },
  toastTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 16, color: colors.ink[900], marginBottom: 4 },
  toastSub: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], paddingVertical: spacing[4] },
  closeBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 20, color: '#FFFFFF' },
  headerGoal: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: '#AAAAAA' },
  headerSpacer: { width: 40 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4], gap: spacing[6] },
  mainValue: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 72, color: '#FFFFFF', letterSpacing: -2 },
  mainLabel: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: '#AAAAAA', marginTop: -16 },
  chipsRow: { flexDirection: 'row', gap: spacing[4] },
  chip: { backgroundColor: '#1A1A1A', borderRadius: radius.sm, paddingVertical: spacing[3], paddingHorizontal: spacing[5], alignItems: 'center', minWidth: 120 },
  chipValue: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 20, color: '#FFFFFF' },
  chipLabel: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#AAAAAA', marginTop: 4 },
  progressContainer: { width: '100%', gap: 8 },
  progressText: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: '#AAAAAA', textAlign: 'center' },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: spacing[6], paddingBottom: spacing[8] },
  controlBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#1A1A1A', alignItems: 'center', justifyContent: 'center' },
  controlIcon: { fontSize: 24, color: '#FFFFFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4] },
  modalBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing[6], width: '100%', gap: spacing[3] },
  modalTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, color: colors.ink[900] },
  modalText: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: colors.ink[500] },
  modalPrimary: { backgroundColor: colors.brand[500], borderRadius: radius.md, height: controlSize.lg, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  modalPrimaryText: { fontFamily: 'PlusJakartaSans-SemiBold', color: colors.surface, fontSize: 15 },
  modalCancel: { height: controlSize.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderDefault, alignItems: 'center', justifyContent: 'center' },
  modalCancelText: { fontFamily: 'PlusJakartaSans', fontSize: 15, color: colors.ink[500] },
});
