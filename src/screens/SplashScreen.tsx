import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation';
import { useAuth } from '../context/AuthContext';
import { getPlan } from '../services/firestore';

type Nav = StackNavigationProp<RootStackParamList, 'Splash'>;

const ANIM_DURATION = 2400; // total ms before navigating

export function SplashScreen() {
  const navigation = useNavigation<Nav>();
  const { user, loading } = useAuth();
  const opacity = useRef(new Animated.Value(0)).current;
  const targetRef = useRef<keyof RootStackParamList | null>(null);
  const navigatedRef = useRef(false);

  const tryNavigate = (t: keyof RootStackParamList) => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;
    navigation.replace(t as any);
  };

  // Resolve route
  useEffect(() => {
    if (loading) return;
    if (!user) {
      targetRef.current = 'OnboardingGoal';
      return;
    }
    getPlan(user.uid)
      .then((plan) => { targetRef.current = plan ? 'MainTabs' : 'OnboardingGoal'; })
      .catch(() => { targetRef.current = 'OnboardingGoal'; });
  }, [user, loading]);

  // Animation + navigation timer
  useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.delay(1000),
      Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: false }),
    ]).start();

    // Navigate after animation completes, with fallback
    const timer = setTimeout(() => {
      tryNavigate(targetRef.current ?? 'OnboardingGoal');
    }, ANIM_DURATION);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity }}>
        <Text style={styles.logo}>Stride</Text>
        <Text style={styles.tagline}>Tu entrenamiento, a tu ritmo</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 40,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
  },
});
