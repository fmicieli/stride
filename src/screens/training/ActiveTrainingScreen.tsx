import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Modal, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getPlan, saveSession, saveStreak, getSessions } from '../../services/firestore';
import { TrainingPlan, TrainingSession, DayKey } from '../../types';
import { formatDuration, formatPace } from '../../utils/planGenerator';
import { colors, spacing, radius, controlSize } from '../../theme';

function PauseIcon() {
  if (Platform.OS === 'web') {
    return (
      // @ts-ignore
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* @ts-ignore */}
        <path d="M 8 4 L 8 18" stroke="#1E8563" strokeWidth="2.5" strokeLinecap="round"/>
        {/* @ts-ignore */}
        <path d="M 14 4 L 14 18" stroke="#1E8563" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    );
  }
  return <Text style={{ fontSize: 22, color: colors.brand[500] }}>⏸</Text>;
}

function PlayIcon() {
  if (Platform.OS === 'web') {
    return (
      // @ts-ignore
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* @ts-ignore */}
        <path d="M 7 3 L 19 11 L 7 19 Z" fill="#1E8563"/>
      </svg>
    );
  }
  return <Text style={{ fontSize: 22, color: colors.brand[500] }}>▶</Text>;
}

type Nav = StackNavigationProp<RootStackParamList, 'ActiveTraining'>;

const DAY_NAMES: DayKey[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

interface Interval { type: 'run' | 'walk'; label: string; duration: number }

function generateIntervals(durationMinutes: number, week: number, method: string): Interval[] {
  const total = Math.max(durationMinutes, 10) * 60;
  if (method !== 'Método Caco') {
    return [{ type: 'run', label: 'Trotar', duration: total }];
  }
  let runSecs = 60, walkSecs = 90;
  if (week >= 9)      { runSecs = 300; walkSecs = 60; }
  else if (week >= 7) { runSecs = 240; walkSecs = 60; }
  else if (week >= 5) { runSecs = 180; walkSecs = 90; }
  else if (week >= 3) { runSecs = 120; walkSecs = 90; }
  const warmup = 90, cooldown = 90;
  const body = total - warmup - cooldown;
  const cycle = runSecs + walkSecs;
  const reps = Math.max(1, Math.floor(body / cycle));
  const result: Interval[] = [{ type: 'walk', label: 'Calentamiento', duration: warmup }];
  for (let i = 0; i < reps; i++) {
    result.push({ type: 'run', label: 'Trotar', duration: runSecs });
    if (i < reps - 1) result.push({ type: 'walk', label: 'Descanso', duration: walkSecs });
  }
  result.push({ type: 'walk', label: 'Enfriamiento', duration: cooldown });
  return result;
}

function getIntervalState(elapsed: number, intervals: Interval[]): { idx: number; countdown: number; progress: number } {
  let t = elapsed;
  for (let i = 0; i < intervals.length; i++) {
    if (t < intervals[i].duration) {
      const countdown = intervals[i].duration - t;
      const progress = t / intervals[i].duration;
      return { idx: i, countdown, progress };
    }
    t -= intervals[i].duration;
  }
  return { idx: intervals.length - 1, countdown: 0, progress: 1 };
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function getDistance(a: { latitude: number; longitude: number }, b: { latitude: number; longitude: number }): number {
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
  const [intervals, setIntervals] = useState<Interval[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [paused, setPaused] = useState(false);
  const [goalReached, setGoalReached] = useState(false);
  const [gpsLost, setGpsLost] = useState(false);
  const prevIntervalIdxRef = useRef(-1);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const locationSub = useRef<{ remove: () => void } | null>(null);
  const lastPos = useRef<{ latitude: number; longitude: number } | null>(null);
  const pausedRef = useRef(false);
  const toastAnim = useRef(new Animated.Value(-120)).current;

  useFocusEffect(
    useCallback(() => {
      if (user) getPlan(user.uid).then((p) => {
        setPlan(p);
        if (p) {
          const todayName = DAY_NAMES[new Date().getDay()];
          const todayDay = p.weeks[0]?.days.find((d) => d.day === todayName);
          const duration = todayDay?.duration ?? 20;
          setIntervals(generateIntervals(duration, p.weeks[0]?.week ?? 1, p.method));
        }
      });
    }, [user]),
  );

  useEffect(() => {
    if (!plan) return;
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setElapsed((e) => e + 1);
    }, 1000);

    (async () => {
      if (Platform.OS === 'web') {
        if (!navigator.geolocation) { setGpsLost(true); return; }
        const watchId = navigator.geolocation.watchPosition(
          (pos) => {
            setGpsLost(false);
            const coords = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
            if (lastPos.current && !pausedRef.current) {
              const d = getDistance(lastPos.current, coords);
              setDistance((prev) => prev + d);
            }
            lastPos.current = coords;
          },
          () => setGpsLost(true),
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
        );
        locationSub.current = { remove: () => navigator.geolocation.clearWatch(watchId) };
      } else {
        const Location = require('expo-location');
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          locationSub.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5, timeInterval: 2000 },
            (loc: any) => {
              setGpsLost(false);
              if (lastPos.current && !pausedRef.current) {
                const d = getDistance(lastPos.current, loc.coords);
                setDistance((prev) => prev + d);
              }
              lastPos.current = loc.coords;
            },
          );
        }
      }
    })();

    const gpsTimeout = setTimeout(() => setGpsLost(true), 15000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      locationSub.current?.remove();
      clearTimeout(gpsTimeout);
    };
  }, [plan]);

  const pace = elapsed > 0 && distance > 0 ? Math.round(elapsed / distance) : 0;
  const totalDuration = intervals.reduce((s, i) => s + i.duration, 0);
  const overallProgress = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 0;
  const { idx: intervalIdx, countdown, progress: intervalProgress } =
    intervals.length > 0 ? getIntervalState(elapsed, intervals) : { idx: 0, countdown: 0, progress: 0 };
  const currentInterval = intervals[intervalIdx];

  // Haptic on interval advance
  useEffect(() => {
    if (intervals.length === 0 || elapsed === 0) return;
    const { idx } = getIntervalState(elapsed, intervals);
    if (prevIntervalIdxRef.current >= 0 && idx !== prevIntervalIdxRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    prevIntervalIdxRef.current = idx;
  }, [elapsed, intervals]);

  // Toast on session complete
  useEffect(() => {
    if (!goalReached && overallProgress >= 1) {
      setGoalReached(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.delay(5000),
        Animated.timing(toastAnim, { toValue: -120, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [overallProgress]);

  const handlePause = () => {
    setPaused((p) => { pausedRef.current = !p; return !p; });
  };

  const handleResume = () => {
    setPaused(false);
    pausedRef.current = false;
  };

  const confirmStop = async () => {
    setPaused(false);
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
        <Text style={styles.toastTitle}>¡Meta lograda!</Text>
        <Text style={styles.toastSub}>Podés seguir corriendo o pausar para finalizar</Text>
      </Animated.View>

      <View style={styles.header}>
        <View style={styles.headerSpacer} />
        <Text style={styles.headerTitle}>
          {currentInterval
            ? `${currentInterval.label} · ${intervalIdx + 1} de ${intervals.length}`
            : 'Entrenamiento'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={[styles.intervalCard, currentInterval?.type === 'run' ? styles.intervalCardRun : styles.intervalCardWalk]}>
          <Text style={[styles.intervalLabel, currentInterval?.type === 'run' ? styles.intervalLabelRun : styles.intervalLabelWalk]}>
            {currentInterval?.label ?? '—'}
          </Text>
          <Text style={[styles.intervalCountdown, currentInterval?.type === 'run' ? styles.intervalCountdownRun : styles.intervalCountdownWalk]}>
            {formatCountdown(countdown)}
          </Text>
          <View style={styles.intervalTrack}>
            <View style={[
              styles.intervalFill,
              currentInterval?.type === 'run' ? styles.intervalFillRun : styles.intervalFillWalk,
              { width: `${Math.round(intervalProgress * 100)}%` as any },
            ]} />
          </View>
          <Text style={styles.overallProgress}>{Math.round(overallProgress * 100)}% del entrenamiento</Text>
        </View>

        <View style={styles.statGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{formatDuration(elapsed)}</Text>
            <Text style={styles.statLabel}>Tiempo</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{distance.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Distancia (km)</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{pace > 0 ? formatPace(pace) : '--:--'}</Text>
            <Text style={styles.statLabel}>Ritmo</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.pauseBtn} onPress={handlePause} activeOpacity={0.8}>
          {paused ? <PlayIcon /> : <PauseIcon />}
        </TouchableOpacity>
      </View>

      <Modal visible={paused} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Entrenamiento en pausa</Text>
              <TouchableOpacity onPress={handleResume} style={styles.modalClose}>
                <Text style={styles.modalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalStats}>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatValue}>{formatDuration(elapsed)}</Text>
                <Text style={styles.modalStatLabel}>Tiempo</Text>
              </View>
              <View style={styles.modalStatBox}>
                <Text style={styles.modalStatValue}>{distance.toFixed(2)}</Text>
                <Text style={styles.modalStatLabel}>Distancia (km)</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.modalPrimary} onPress={handleResume}>
              <Text style={styles.modalPrimaryText}>Reanudar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalSecondary} onPress={confirmStop}>
              <Text style={styles.modalSecondaryText}>Finalizar entrenamiento</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.surface },
  gpsBanner: { backgroundColor: colors.warning.bg, paddingVertical: 8, paddingHorizontal: spacing[4], alignItems: 'center' },
  gpsBannerText: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: colors.warning.text },
  toast: { position: 'absolute', top: 80, left: spacing[4], right: spacing[4], backgroundColor: colors.brand[50], borderRadius: radius.sm, padding: spacing[4], zIndex: 100 },
  toastTitle: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 15, color: colors.brand[700] ?? colors.brand[600], marginBottom: 2 },
  toastSub: { fontFamily: 'PlusJakartaSans', fontSize: 13, color: colors.brand[600] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], height: 56, borderBottomWidth: 1, borderBottomColor: colors.surfaceMuted },
  headerTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, color: colors.ink[900] },
  headerSpacer: { width: 28 },
  content: { flex: 1, paddingHorizontal: spacing[5], paddingTop: spacing[5], gap: spacing[5] },
  intervalCard: { borderRadius: radius.md, padding: spacing[6], alignItems: 'center', gap: spacing[3] },
  intervalCardRun: { backgroundColor: colors.brand[50] },
  intervalCardWalk: { backgroundColor: colors.surfaceMuted },
  intervalLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, letterSpacing: 1.5, textTransform: 'uppercase' as const },
  intervalLabelRun: { color: colors.brand[600] },
  intervalLabelWalk: { color: colors.ink[500] },
  intervalCountdown: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 56, letterSpacing: -2 },
  intervalCountdownRun: { color: colors.brand[600] },
  intervalCountdownWalk: { color: colors.ink[700] },
  intervalTrack: { height: 6, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 3, overflow: 'hidden', alignSelf: 'stretch' },
  intervalFill: { height: '100%', borderRadius: 3 },
  intervalFillRun: { backgroundColor: colors.brand[500] },
  intervalFillWalk: { backgroundColor: colors.ink[300] },
  overallProgress: { fontFamily: 'PlusJakartaSans', fontSize: 12, color: colors.ink[400] },
  statGrid: { flexDirection: 'row', gap: spacing[3] },
  statBox: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: spacing[3], backgroundColor: colors.surfaceMuted, borderRadius: radius.sm },
  statValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: colors.ink[900] },
  statLabel: { fontFamily: 'PlusJakartaSans', fontSize: 10, color: colors.ink[500], textAlign: 'center' },
  footer: { paddingBottom: spacing[8], alignItems: 'center', paddingTop: spacing[4] },
  pauseBtn: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.borderDefault, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4] },
  modalBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing[6], width: '100%', gap: spacing[4], borderWidth: 1, borderColor: colors.borderDefault },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 17, color: colors.ink[900] },
  modalClose: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 16, color: colors.ink[400] },
  modalStats: { flexDirection: 'row', gap: spacing[3] },
  modalStatBox: { flex: 1, gap: 4 },
  modalStatValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: colors.ink[900] },
  modalStatLabel: { fontFamily: 'PlusJakartaSans', fontSize: 10, color: colors.ink[500] },
  modalPrimary: { backgroundColor: colors.ink[900], borderRadius: radius.md, height: controlSize.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  modalPrimaryText: { fontFamily: 'PlusJakartaSans-Bold', color: colors.surface, fontSize: 15 },
  modalSecondary: { height: controlSize.lg, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.borderDefault, alignItems: 'center', justifyContent: 'center' },
  modalSecondaryText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, color: colors.ink[900] },
});
