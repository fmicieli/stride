import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getPlan, saveSession, saveStreak, getSessions } from '../../services/firestore';
import { TrainingPlan, TrainingSession, DayKey } from '../../types';
import { formatDuration, buildSessionIntervals, SessionInterval } from '../../utils/planGenerator';
import { Button } from '../../components/Button';
import { BottomSheet } from '../../components/BottomSheet';
import { colors, spacing, radius } from '../../theme';

const DING = require('../../../assets/ding.wav');

const TRACK_BG = '#0D1210';
const TRACK_SUBTLE = 'rgba(255,255,255,0.10)';
const TRACK_MUTED = '#B9BFBC';

function ControlIcon({ name }: { name: 'pause' | 'play' }) {
  if (Platform.OS === 'web') {
    if (name === 'play') {
      return (
        // @ts-ignore
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* @ts-ignore */}
          <path d="M 7 4 L 18 11 L 7 18 Z" fill="#FFFFFF" />
        </svg>
      );
    }
    return (
      // @ts-ignore
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* @ts-ignore */}
        <path d="M 8 4 L 8 18" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        {/* @ts-ignore */}
        <path d="M 14 4 L 14 18" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
      </svg>
    );
  }
  return <Text style={{ fontSize: 22, color: '#FFFFFF' }}>{name === 'play' ? '▶' : '⏸'}</Text>;
}

type Nav = StackNavigationProp<RootStackParamList, 'ActiveTraining'>;

const DAY_NAMES: DayKey[] = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function getIntervalState(elapsed: number, intervals: SessionInterval[]): { idx: number; countdown: number } {
  let t = elapsed;
  for (let i = 0; i < intervals.length; i++) {
    if (t < intervals[i].duration) {
      return { idx: i, countdown: intervals[i].duration - t };
    }
    t -= intervals[i].duration;
  }
  return { idx: intervals.length - 1, countdown: 0 };
}

function formatCountdown(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function momentLabel(type?: 'run' | 'walk'): string {
  if (type === 'walk') return 'Momento de caminar';
  return 'Momento de trotar';
}

export function ActiveTrainingScreen() {
  const navigation = useNavigation<Nav>();
  const { user } = useAuth();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [intervals, setIntervals] = useState<SessionInterval[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState<'countdown' | 'running'>('countdown');
  const [count, setCount] = useState(3);
  const countAnim = useRef(new Animated.Value(0)).current;
  const prevIntervalIdxRef = useRef(-1);
  const finishingRef = useRef(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const dingRef = useRef<Audio.Sound | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (user) getPlan(user.uid).then((p) => {
        setPlan(p);
        if (p) {
          const todayName = DAY_NAMES[new Date().getDay()];
          const todayDay = p.weeks[0]?.days.find((d) => d.day === todayName);
          const runTarget = todayDay?.runTargetMin ?? todayDay?.duration ?? 20;
          setIntervals(buildSessionIntervals(runTarget, p.weeks[0]?.week ?? 1, p.method));
        }
      });
    }, [user]),
  );

  // Preload the interval-change chime
  useEffect(() => {
    let mounted = true;
    Audio.setAudioModeAsync({ playsInSilentModeIOS: true }).catch(() => {});
    Audio.Sound.createAsync(DING, { volume: 0.9 })
      .then(({ sound }) => {
        if (mounted) dingRef.current = sound;
        else sound.unloadAsync();
      })
      .catch(() => {});
    return () => {
      mounted = false;
      dingRef.current?.unloadAsync();
      dingRef.current = null;
    };
  }, []);

  // 3·2·1 countdown with a bell on each beat, before the warm-up starts
  useEffect(() => {
    if (phase !== 'countdown' || intervals.length === 0) return;
    let n = 3;
    setCount(n);

    const beat = () => {
      dingRef.current?.replayAsync().catch(() => {});
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      countAnim.setValue(0);
      Animated.timing(countAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }).start();
    };
    beat();

    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        countAnim.setValue(1);
        setPhase('running');
        return;
      }
      setCount(n);
      beat();
    }, 900);

    const settle = setTimeout(() => setPhase('running'), 900 * 3 + 800);
    return () => {
      clearInterval(id);
      clearTimeout(settle);
    };
  }, [phase, intervals.length]);

  useEffect(() => {
    if (!plan || phase !== 'running') return;
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [plan, phase]);

  const totalDuration = intervals.reduce((s, i) => s + i.duration, 0);
  const overallProgress = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 0;
  const { idx: intervalIdx, countdown } =
    intervals.length > 0 ? getIntervalState(elapsed, intervals) : { idx: 0, countdown: 0 };
  const currentInterval = intervals[intervalIdx];
  const nextInterval = intervals[intervalIdx + 1];

  const confirmStop = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);

    const sessionId = Date.now().toString();
    if (user) {
      try {
        const today = new Date();
        const todayKey = DAY_NAMES[today.getDay()];
        const session: TrainingSession = {
          id: sessionId, date: today.toISOString(), type: 'Trote con intervalos',
          duration: elapsed, distance: 0, pace: 0,
          week: plan?.weeks[0]?.week ?? 1, day: todayKey,
          completed: elapsed > 60,
        };
        await saveSession(user.uid, session);
        const allSessions = await getSessions(user.uid);
        await saveStreak(user.uid, allSessions.filter((s) => s.completed).length, new Date().toISOString());
      } catch { /* navigate anyway */ }
    }
    navigation.navigate('TrainingCompleted', { sessionId });
  }, [user, elapsed, plan, navigation]);

  // Chime + haptic on interval advance
  useEffect(() => {
    if (intervals.length === 0 || elapsed === 0) return;
    const { idx } = getIntervalState(elapsed, intervals);
    if (prevIntervalIdxRef.current >= 0 && idx !== prevIntervalIdxRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      dingRef.current?.replayAsync().catch(() => {});
    }
    prevIntervalIdxRef.current = idx;
  }, [elapsed, intervals]);

  // Auto-finish when the full session duration is reached
  useEffect(() => {
    if (totalDuration > 0 && overallProgress >= 1) {
      confirmStop();
    }
  }, [overallProgress, totalDuration, confirmStop]);

  const handlePause = () => {
    setPaused((p) => { pausedRef.current = !p; return !p; });
  };

  const handleResume = () => {
    setPaused(false);
    pausedRef.current = false;
  };

  const nextHint = nextInterval
    ? `Después · ${nextInterval.label} ${formatCountdown(nextInterval.duration)}`
    : 'Último tramo';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            Intervalo {Math.min(intervalIdx + 1, intervals.length || 1)} de {intervals.length || 1}
          </Text>
        </View>

        <Text style={styles.segLabel}>{momentLabel(currentInterval?.type)}</Text>

        <Text style={styles.timer}>{formatCountdown(countdown)}</Text>

        <Text style={styles.hint}>{nextHint}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.ctrlPrimary} onPress={handlePause} activeOpacity={0.85}>
          <ControlIcon name={paused ? 'play' : 'pause'} />
        </TouchableOpacity>
      </View>

      <BottomSheet visible={paused} onClose={handleResume} title="Entrenamiento en pausa">
        <View style={styles.modalStats}>
          <View style={styles.modalStatBox}>
            <Text style={styles.modalStatValue}>{formatDuration(elapsed)}</Text>
            <Text style={styles.modalStatLabel}>Tiempo total</Text>
          </View>
          <View style={styles.modalStatBox}>
            <Text style={styles.modalStatValue}>
              {Math.min(intervalIdx + 1, intervals.length || 1)} de {intervals.length || 1}
            </Text>
            <Text style={styles.modalStatLabel}>Intervalo</Text>
          </View>
        </View>
        <Button label="Reanudar" onPress={handleResume} />
        <Button label="Finalizar entrenamiento" variant="tertiaryDanger" onPress={confirmStop} />
      </BottomSheet>

      {phase === 'countdown' && (
        <View style={styles.countdownOverlay}>
          <Text style={styles.countdownLabel}>Preparate</Text>
          <Animated.Text
            style={[
              styles.countdownNum,
              {
                opacity: countAnim,
                transform: [
                  { scale: countAnim.interpolate({ inputRange: [0, 1], outputRange: [1.8, 1] }) },
                ],
              },
            ]}
          >
            {count}
          </Animated.Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: TRACK_BG },

  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[5], gap: spacing[4] },
  badge: { backgroundColor: TRACK_SUBTLE, borderRadius: radius.full, paddingVertical: 5, paddingHorizontal: spacing[3] },
  badgeText: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 13, color: colors.surface },
  segLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 26, lineHeight: 32, color: colors.surface, textAlign: 'center' },
  timer: { fontFamily: 'JetBrainsMono-Medium', fontSize: 52, lineHeight: 62, color: colors.surface, fontVariant: ['tabular-nums'] },
  hint: { fontFamily: 'PlusJakartaSans-Medium', fontSize: 13, color: TRACK_MUTED, textAlign: 'center' },

  footer: { paddingBottom: spacing[8], paddingTop: spacing[4], alignItems: 'center' },
  ctrlPrimary: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.brand[500], alignItems: 'center', justifyContent: 'center' },

  countdownOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: TRACK_BG, alignItems: 'center', justifyContent: 'center', gap: spacing[3], zIndex: 10 },
  countdownLabel: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 16, letterSpacing: 2, color: TRACK_MUTED, textTransform: 'uppercase' },
  countdownNum: { fontFamily: 'JetBrainsMono-Medium', fontSize: 120, lineHeight: 134, color: colors.surface, fontVariant: ['tabular-nums'] },

  modalStats: { flexDirection: 'row', gap: spacing[3] },
  modalStatBox: { flex: 1, gap: 6, backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, padding: spacing[4] },
  modalStatValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 22, color: colors.ink[900] },
  modalStatLabel: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 10.5, color: colors.ink[500], textTransform: 'uppercase', letterSpacing: 0.5 },
});
