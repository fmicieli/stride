import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useOnboarding } from '../utils/onboardingContext';
import { useAuth } from '../context/AuthContext';
import { generatePlan } from '../utils/planGenerator';
import { savePlan, saveUserProfile } from '../services/firestore';
import { spacing } from '../theme';

type Nav = StackNavigationProp<RootStackParamList, 'PlanLoading'>;

const BG = '#0D0D0F';
const DOT_COLOR = '#8FE05A';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#9A9A9F';

export function PlanLoadingScreen() {
  const navigation = useNavigation<Nav>();
  const { data, setPendingPlan } = useOnboarding();
  const { user } = useAuth();

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.delay(600 - delay),
        ]),
      );
    Animated.parallel([anim(dot1, 0), anim(dot2, 200), anim(dot3, 400)]).start();
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      try {
        if (data.goal && data.goalMode && data.level && data.days.length > 0 && data.targetDate) {
          const plan = generatePlan(data.goal, data.goalMode, data.level, data.days, data.targetDate);
          if (user) {
            try {
              await savePlan(user.uid, plan);
              await saveUserProfile(user.uid, { onboardingDone: true } as any);
            } catch { /* Firestore unavailable */ }
          }
          setPendingPlan(plan);
        }
      } catch (e) {
        console.error('Error generating plan:', e);
      } finally {
        navigation.replace(user ? 'MainTabs' : 'Register');
      }
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  const dotStyle = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -8] }) }],
  });

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.container}>
          <View style={styles.dotsRow}>
            <Animated.View style={[styles.dot, dotStyle(dot1)]} />
            <Animated.View style={[styles.dot, dotStyle(dot2)]} />
            <Animated.View style={[styles.dot, dotStyle(dot3)]} />
          </View>
          <Text style={styles.title}>Creando tu plan...</Text>
          <Text style={styles.subtitle}>Esto puede tardar unos segundos</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[4] },
  dotsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing[7] },
  dot: { width: 12, height: 12, borderRadius: 6, backgroundColor: DOT_COLOR },
  title: { fontFamily: 'PlusJakartaSans-SemiBold', fontSize: 18, color: TEXT, marginBottom: spacing[2] },
  subtitle: { fontFamily: 'PlusJakartaSans', fontSize: 14, color: TEXT_MUTED },
});
