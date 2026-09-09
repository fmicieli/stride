import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { StrideLogo } from '../../components/StrideLogo';
import { Button } from '../../components/Button';
import { colors, spacing } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();
  const sloganOpacity = useRef(new Animated.Value(0)).current;
  const footerOpacity = useRef(new Animated.Value(0)).current;
  const footerShift = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    // Let the logo entrance play, then fade in the slogan and the buttons.
    const delay = Platform.OS === 'web' ? 1600 : 350;
    const t = setTimeout(() => {
      Animated.sequence([
        Animated.timing(sloganOpacity, { toValue: 1, duration: 320, useNativeDriver: false }),
        Animated.parallel([
          Animated.timing(footerOpacity, { toValue: 1, duration: 380, useNativeDriver: false }),
          Animated.timing(footerShift, { toValue: 0, duration: 380, useNativeDriver: false }),
        ]),
      ]).start();
    }, delay);
    // Safety net: if the animation loop is throttled (hidden tab), snap to the
    // final state so the slogan and buttons are never left invisible.
    const settle = setTimeout(() => {
      sloganOpacity.setValue(1);
      footerOpacity.setValue(1);
      footerShift.setValue(0);
    }, delay + 2600);
    return () => {
      clearTimeout(t);
      clearTimeout(settle);
    };
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <StrideLogo width={225} animated />
        <Animated.Text style={[styles.slogan, { opacity: sloganOpacity }]}>
          Tu entrenamiento, a tu ritmo
        </Animated.Text>
      </View>

      <Animated.View
        style={[styles.footer, { opacity: footerOpacity, transform: [{ translateY: footerShift }] }]}
      >
        <Button label="Empezar" onPress={() => navigation.navigate('OnboardingGoal')} />
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[4],
    gap: spacing[3],
  },
  slogan: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    color: colors.ink[500],
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[6],
    paddingTop: spacing[4],
    gap: spacing[3],
    alignItems: 'center',
  },
  loginLink: {
    fontFamily: 'PlusJakartaSans-Medium',
    fontSize: 15,
    color: colors.ink[600],
  },
});
