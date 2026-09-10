import React, { useEffect, useRef, useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Platform, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { RootStackParamList } from '../../navigation';
import { useAuth } from '../../context/AuthContext';
import { getPlan, saveSession, saveStreak, getSessions } from '../../services/firestore';
import { pendingRun } from '../../storage/storage';
import { TrainingPlan, TrainingSession, DayKey } from '../../types';
import { formatDuration, buildSessionIntervals, SessionInterval, computeKm } from '../../utils/planGenerator';
import { say, primeVoice, ringBell } from '../../utils/voice';
import { Button } from '../../components/Button';
import { BottomSheet } from '../../components/BottomSheet';
import { SessionSummary } from '../../components/SessionSummary';
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

/** Label shown on screen AND spoken — both must match. */
function cueForInterval(iv?: SessionInterval): string {
  if (!iv) return '';
  if (iv.label === 'Calentamiento') return 'Calentamiento';
  if (iv.label === 'Enfriamiento') return 'Enfriamiento';
  return iv.type === 'run' ? 'A trotar' : 'A caminar';
}

export function ActiveTrainingScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'ActiveTraining'>>();
  const isResume = route.params?.resume === true;
  const { user } = useAuth();
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [intervals, setIntervals] = useState<SessionInterval[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [phase, setPhase] = useState<'countdown' | 'running'>('countdown');
  const [count, setCount] = useState(3);
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showStopSummary, setShowStopSummary] = useState(false);
  const [ready, setReady] = useState(!isResume);
  const [pendingElapsedRaw, setPendingElapsedRaw] = useState<number | null>(null);
  const countAnim = useRef(new Animated.Value(0)).current;
  const prevIntervalIdxRef = useRef(-1);
  const finishingRef = useRef(false);
  const resumeLoadedRef = useRef(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pausedRef = useRef(false);
  const dingRef = useRef<Audio.Sound | null>(null);

  // Resume: load raw elapsed from storage, wait for intervals before snapping
  useEffect(() => {
    if (!isResume || resumeLoadedRef.current) return;
    resumeLoadedRef.current = true;
    pendingRun.get(user?.uid ?? '').then((pr) => {
      if (pr) setPendingElapsedRaw(pr.elapsed);
      else setReady(true);
    });
    primeVoice();
  }, [isResume, user]);

  // Once intervals are loaded, snap elapsed to the START of the interrupted interval
  useEffect(() => {
    if (!isResume || pendingElapsedRaw === null || intervals.length === 0) return;
    const { idx } = getIntervalState(pendingElapsedRaw, intervals);
    let startOfInterval = 0;
    for (let i = 0; i < idx; i++) startOfInterval += intervals[i].duration;
    setElapsed(startOfInterval);
    setPendingElapsedRaw(null);
    setReady(true);
  }, [isResume, pendingElapsedRaw, intervals]);

  // Make the status bar dark while on this screen (PWA + Chrome Android)
  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'web') {
        const meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', '#0D1210');
      }
      return () => {
        if (Platform.OS === 'web') {
          const meta = document.querySelector('meta[name="theme-color"]');
          if (meta) meta.setAttribute('content', '#1B6E52');
        }
      };
    }, []),
  );

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

  // 3·2·1 countdown with a spoken beat + bell, before the warm-up starts
  useEffect(() => {
    if (phase !== 'countdown' || intervals.length === 0) return;
    let n = 3;
    setCount(n);

    const beat = (spoken: number) => {
      if (Platform.OS === 'web') ringBell(1);
      else dingRef.current?.replayAsync().catch(() => {});
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      say(String(spoken));
      countAnim.setValue(0);
      Animated.timing(countAnim, {
        toValue: 1,
        duration: 420,
        easing: Easing.out(Easing.back(1.7)),
        useNativeDriver: true,
      }).start();
    };
    beat(3);

    const id = setInterval(() => {
      n -= 1;
      if (n <= 0) {
        clearInterval(id);
        countAnim.setValue(1);
        if (Platform.OS === 'web') ringBell(1);
        say(cueForInterval(intervals[0]));
        setPhase('running');
        return;
      }
      setCount(n);
      beat(n);
    }, 900);

    const settle = setTimeout(() => setPhase('running'), 900 * 3 + 800);
    return () => {
      clearInterval(id);
      clearTimeout(settle);
    };
  }, [phase, intervals.length]);

  useEffect(() => {
    if (!plan || phase !== 'running' || !ready) return;
    timerRef.current = setInterval(() => {
      if (!pausedRef.current) setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [plan, phase, ready]);

  const totalDuration = intervals.reduce((s, i) => s + i.duration, 0);
  const overallProgress = totalDuration > 0 ? Math.min(1, elapsed / totalDuration) : 0;
  const { idx: intervalIdx, countdown } =
    intervals.length > 0 ? getIntervalState(elapsed, intervals) : { idx: 0, countdown: 0 };
  const currentInterval = intervals[intervalIdx];
  const nextInterval = intervals[intervalIdx + 1];

  // "N de M" intervals — completed count over total, no GPS stats
  const intervalsDone = Math.min(intervalIdx, intervals.length);
  const intervalsStat = { value: `${intervalsDone} de ${intervals.length || 0}`, label: 'Intervalos' };

  // Full workout done → save it, clear any pending state, show the summary screen
  const confirmStop = useCallback(async () => {
    if (finishingRef.current) return;
    finishingRef.current = true;
    setPaused(false);
    if (timerRef.current) clearInterval(timerRef.current);
    pendingRun.clear().catch(() => {});

    // Triple bell + voice cue before navigating
    if (Platform.OS === 'web') {
      ringBell(3);
    } else {
      for (let i = 0; i < 3; i++) {
        await dingRef.current?.replayAsync().catch(() => {});
        if (i < 2) await new Promise(r => setTimeout(r, 650));
      }
    }
    await new Promise(r => setTimeout(r, 400));
    say('Entrenamiento terminado');
    await new Promise(r => setTimeout(r, 1400));

    const sessionId = Date.now().toString();
    if (user) {
      try {
        const today = new Date();
        const todayKey = DAY_NAMES[today.getDay()];
        const session: TrainingSession = {
          id: sessionId, date: today.toISOString(), type: 'Trote con intervalos',
          duration: elapsed, distance: 0, pace: 0,
          week: plan?.weeks[0]?.week ?? 1, day: todayKey,
          completed: true,
        };
        await saveSession(user.uid, session);
        const allSessions = await getSessions(user.uid);
        await saveStreak(user.uid, allSessions.filter((s) => s.completed).length, new Date().toISOString());
      } catch { /* navigate anyway */ }
    }
    navigation.navigate('TrainingCompleted', { sessionId });
  }, [user, elapsed, plan, navigation]);

  // "Finalizar entrenamiento" from the pause sheet
  const handleFinishPressed = () => {
    if (totalDuration > 0 && overallProgress >= 1) {
      confirmStop();
      return;
    }
    setPaused(false);
    setShowFinishConfirm(true);
  };

  // User confirmed leaving before finishing → remember progress for the rest of today
  const handleLeaveIncomplete = async () => {
    pausedRef.current = true;
    await pendingRun.set(elapsed, user?.uid ?? '').catch(() => {});
    setShowFinishConfirm(false);
    setShowStopSummary(true);
  };

  const handleResumeFromSummary = () => {
    setShowStopSummary(false);
    setShowFinishConfirm(false);
    setPaused(false);
    pausedRef.current = false;
  };

  // Voice + chime cues: segment change, "10 segundos", "3", "2", "1"
  useEffect(() => {
    if (phase !== 'running' || intervals.length === 0 || elapsed === 0) return;
    const { idx, countdown: left } = getIntervalState(elapsed, intervals);
    const firstRun = prevIntervalIdxRef.current < 0;

    if (!firstRun && idx !== prevIntervalIdxRef.current) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      if (Platform.OS === 'web') ringBell(1);
      else dingRef.current?.replayAsync().catch(() => {});
      say(cueForInterval(intervals[idx]));
    } else if (!firstRun) {
      // final-seconds callouts while a segment runs down
      if (left === 10) say('10 segundos');
      else if (left >= 1 && left <= 3) say(String(left));
    }
    prevIntervalIdxRef.current = idx;
  }, [elapsed, intervals, phase]);

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

        <Text style={styles.segLabel}>{cueForInterval(currentInterval)}</Text>

        <Text style={styles.timer}>{formatCountdown(countdown)}</Text>

        <Text style={styles.hint}>{nextHint}</Text>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.ctrlPrimary} onPress={handlePause} activeOpacity={0.85}>
          <ControlIcon name={paused ? 'play' : 'pause'} />
        </TouchableOpacity>
      </View>

      <BottomSheet visible={paused} onClose={handleResume}>
        <SessionSummary
          variant="paused"
          title="Entrenamiento en pausa"
          subtitle="Tomate el tiempo que necesites. Cuando quieras, seguimos."
          stats={(() => {
            const km = computeKm(elapsed, intervals);
            const totalKm = Math.round((km.kmRun + km.kmWalk) * 10) / 10;
            return [
              { value: formatDuration(elapsed), label: 'Tiempo total' },
              { value: `${totalKm} km`, label: 'Km en esta sesión' },
              { value: `${km.tramosRun} de ${km.tramosTotal}`, label: 'Intervalos compl.' },
            ];
          })()}
        />
        <Button label="Reanudar" onPress={handleResume} />
        <Button label="Finalizar entrenamiento" variant="tertiaryDanger" onPress={handleFinishPressed} />
      </BottomSheet>

      <BottomSheet
        visible={showFinishConfirm}
        onClose={() => { setShowFinishConfirm(false); setPaused(true); }}
        title="No terminaste el entrenamiento"
        subtitle="¿Querés finalizarlo igual? Vas a poder retomarlo más tarde durante el día."
      >
        <Button label="Sí, finalizar" variant="tertiaryDanger" onPress={handleLeaveIncomplete} />
        <Button label="Seguir entrenando" onPress={() => { setShowFinishConfirm(false); setPaused(true); }} />
      </BottomSheet>

      {showStopSummary && (
        <SafeAreaView style={styles.stopScreen} edges={['top', 'bottom']}>
          <ScrollView contentContainerStyle={styles.stopContent} showsVerticalScrollIndicator={false}>
            <SessionSummary
              variant="paused"
              title="Entrenamiento en pausa"
              subtitle="Guardamos tu progreso. Podés retomarlo cuando quieras hoy."
              stats={(() => {
                const km = computeKm(elapsed, intervals);
                const totalKm = Math.round((km.kmRun + km.kmWalk) * 10) / 10;
                return [
                  { value: formatDuration(elapsed), label: 'Tiempo total' },
                  { value: `${totalKm} km`, label: 'Km en esta sesión' },
                  { value: `${km.tramosRun} de ${km.tramosTotal}`, label: 'Intervalos compl.' },
                ];
              })()}
            />
          </ScrollView>
          <View style={styles.stopFooter}>
            <Button label="Reanudar" onPress={handleResumeFromSummary} />
            <Button
              label="Volver a inicio"
              variant="tertiary"
              onPress={() => {
                setShowStopSummary(false);
                navigation.navigate('MainTabs');
              }}
            />
          </View>
        </SafeAreaView>
      )}

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

  stopScreen: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.surface, zIndex: 20 },
  stopContent: {
    flexGrow: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[6],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[5],
  },
  stopFooter: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[3],
    paddingBottom: spacing[4],
    gap: spacing[2],
    backgroundColor: colors.surface,
  },
});
