import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { StrideLogo } from '../../components/StrideLogo';
import { Button } from '../../components/Button';
import { dg } from '../../components/darkGlassTokens';
import { spacing } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;

const heroSource = require('../../../assets/welcome-hero.jpg');
const heroUri = typeof heroSource === 'string' ? heroSource : heroSource.uri;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerShift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Let the logo entrance play, then fade in the buttons.
    const delay = Platform.OS === 'web' ? 1200 : 350;
    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(footerOpacity, { toValue: 1, duration: 380, useNativeDriver: false }),
        Animated.timing(footerShift, { toValue: 0, duration: 380, useNativeDriver: false }),
      ]).start();
    }, delay);
    // Safety net: if the animation loop is throttled (hidden tab), snap to the
    // final state so the buttons are never left invisible.
    const settle = setTimeout(() => {
      footerOpacity.setValue(1);
      footerShift.setValue(0);
    }, delay + 2200);
    return () => {
      clearTimeout(t);
      clearTimeout(settle);
    };
  }, []);

  return (
    <View style={styles.root}>
      <View style={styles.hero}>
        {Platform.OS === 'web' ? (
          <View style={styles.heroImageWeb} />
        ) : (
          <Image source={heroSource} style={styles.heroImage} resizeMode="cover" />
        )}
        <View style={styles.heroOverlay} pointerEvents="none" />
        <View style={styles.logoWrap}>
          <StrideLogo width={225} color="#FFFFFF" animated />
        </View>
        <View style={styles.fade} pointerEvents="none" />
      </View>

      <SafeAreaView style={styles.safeFooter} edges={['bottom']}>
        <Animated.View
          style={[styles.footer, { opacity: footerOpacity, transform: [{ translateY: footerShift }] }]}
        >
          <Button label="Continuar" dark onPress={() => navigation.navigate('OnboardingGoal')} />
          <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0D0D0F' },
  hero: { flex: 1, overflow: 'hidden' },
  heroImage: { ...StyleSheet.absoluteFillObject },
  heroImageWeb: {
    ...StyleSheet.absoluteFillObject,
    ...({
      backgroundImage: `url(${heroUri})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    } as any),
  },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10,10,12,0.45)' },
  logoWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  fade:
    Platform.OS === 'web'
      ? ({
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 110,
          backgroundImage: 'linear-gradient(to bottom, rgba(13,13,15,0), rgba(13,13,15,1))',
        } as any)
      : { position: 'absolute', left: 0, right: 0, bottom: 0, height: 70, backgroundColor: 'rgba(13,13,15,0.85)' },
  safeFooter: { backgroundColor: '#0D0D0F' },
  footer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
    paddingTop: spacing[2],
    gap: spacing[4],
    alignItems: 'center',
  },
  loginLink: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    color: dg.ink500,
  },
});
