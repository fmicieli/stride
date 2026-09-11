import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { getSessions } from '../services/firestore';
import { TrainingSession } from '../types';
import { getStreakFromSessions } from '../utils/stats';
import { Icon, IconName } from '../components/Icon';
import { DarkGlassBackground } from '../components/DarkGlassBackground';
import { GlassCard } from '../components/GlassCard';
import { ProgressRing } from '../components/ProgressRing';
import { FadeInUp } from '../components/FadeInUp';
import { dg } from '../components/darkGlassTokens';
import { spacing } from '../theme';

type Achievement = { id: string; title: string; icon: IconName; target: number; value: number };

function buildAchievements(totalSessions: number, streak: number): Achievement[] {
  return [
    { id: 'first', title: 'Primer entrenamiento', icon: 'run', target: 1, value: totalSessions },
    { id: 'streak7', title: 'Racha de 7 días', icon: 'flame', target: 7, value: streak },
    { id: 'ten', title: '10 entrenamientos', icon: 'route', target: 10, value: totalSessions },
    { id: 'streak14', title: 'Racha de 14 días', icon: 'flame', target: 14, value: streak },
  ];
}

function goldFill(size: number) {
  return {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: dg.gold2,
    borderWidth: 2,
    borderColor: dg.goldBorder,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  };
}

function MedalCard({ achievement }: { achievement: Achievement }) {
  return (
    <GlassCard variant="secondary" style={styles.medalCard}>
      <View style={goldFill(56)}>
        <Icon name="star" size={24} color="#FFFFFF" />
      </View>
      <Text style={styles.medalName}>{achievement.title}</Text>
      <Text style={styles.medalDate}>Desbloqueado</Text>
    </GlassCard>
  );
}

function NextCard({ achievement }: { achievement: Achievement }) {
  const pct = Math.min(100, Math.round((achievement.value / achievement.target) * 100));
  return (
    <GlassCard variant="secondary" style={styles.nextCard}>
      <View style={styles.nextIconWrap}>
        <Icon name={achievement.icon} size={18} color={dg.ink500} />
      </View>
      <View style={styles.nextText}>
        <Text style={styles.nextTitle}>{achievement.title}</Text>
        <Text style={styles.nextSub}>
          {Math.min(achievement.value, achievement.target)} de {achievement.target}
          {achievement.icon === 'flame' ? ' días' : ''}
        </Text>
        <View style={styles.nextTrack}>
          <View style={[styles.nextFill, { width: `${pct}%` }]} />
        </View>
      </View>
      <Text style={styles.nextPct}>{pct}%</Text>
    </GlassCard>
  );
}

export function LogrosScreen() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      setLoading(true);
      getSessions(user.uid).then(setSessions).finally(() => setLoading(false));
    }, [user]),
  );

  const totalSessions = sessions.filter((s) => s.completed).length;
  const streak = getStreakFromSessions(sessions);
  const achievements = buildAchievements(totalSessions, streak);
  const unlocked = achievements.filter((a) => a.value >= a.target);
  const locked = achievements.filter((a) => a.value < a.target);

  if (loading) {
    return (
      <View style={styles.root}>
        <DarkGlassBackground glow="topRight" glowSize={260} glowOpacity={0.18} />
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
          <View style={styles.center}><ActivityIndicator color={dg.accent} /></View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <DarkGlassBackground glow="topRight" glowSize={260} glowOpacity={0.18} />
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.pageTitle}>Logros</Text>

          <FadeInUp>
            <GlassCard variant="primary" style={styles.heroCard}>
              <ProgressRing
                size={88}
                strokeWidth={8}
                progress={achievements.length ? unlocked.length / achievements.length : 0}
                trackColor={dg.track}
                arcColor={dg.accent}
                centerLabel={`${unlocked.length}/${achievements.length}`}
              />
              <Text style={styles.heroSub}>{unlocked.length} de {achievements.length} logros desbloqueados</Text>
            </GlassCard>
          </FadeInUp>

          {unlocked.length > 0 && (
            <View style={styles.medalGrid}>
              {unlocked.map((a, i) => (
                <FadeInUp key={a.id} delay={100 + i * 60} style={styles.medalCardWrap}>
                  <MedalCard achievement={a} />
                </FadeInUp>
              ))}
            </View>
          )}

          {locked.length > 0 && (
            <FadeInUp delay={100 + unlocked.length * 60 + 60}>
              <View style={styles.nextSection}>
                <Text style={styles.sectionTitle}>Próximo logro</Text>
                {locked.slice(0, 2).map((a) => <NextCard key={a.id} achievement={a} />)}
              </View>
            </FadeInUp>
          )}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0F' },
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: spacing[4], paddingTop: spacing[5], paddingBottom: spacing[10], gap: spacing[6] },
  pageTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: dg.ink900 },

  heroCard: { alignItems: 'center', borderRadius: 20, padding: spacing[6], gap: spacing[3] },
  heroSub: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 13, color: dg.ink500, textAlign: 'center' },

  medalGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[3] },
  medalCardWrap: { flexBasis: '47%', flexGrow: 1 },
  medalCard: { alignItems: 'center', borderRadius: 20, paddingVertical: spacing[5], paddingHorizontal: spacing[3], gap: 8 },
  medalName: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: dg.ink900, textAlign: 'center' },
  medalDate: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11, color: dg.ink500 },

  nextSection: { gap: spacing[3] },
  sectionTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 17, color: dg.ink900 },
  nextCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: spacing[4], gap: spacing[3] },
  nextIconWrap: { width: 40, height: 40, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },
  nextText: { flex: 1, gap: 4 },
  nextTitle: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 14, color: dg.ink900 },
  nextSub: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 11.5, color: dg.ink500 },
  nextTrack: { height: 6, borderRadius: 999, backgroundColor: dg.track, marginTop: 4, overflow: 'hidden' },
  nextFill: { height: '100%', borderRadius: 999, backgroundColor: dg.accent },
  nextPct: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 15, color: dg.accent },
});
