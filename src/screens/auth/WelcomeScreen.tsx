import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { StrideLogo } from '../../components/StrideLogo';
import { Button } from '../../components/Button';
import { colors, spacing, radius } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <StrideLogo width={168} />
        <View style={styles.placeholder} />
        <View style={styles.textBlock}>
          <Text style={styles.headline}>De tu primer trote a cruzar la meta</Text>
          <Text style={styles.subtitle}>
            Un plan hecho a tu medida, paso a paso, sin que tengas que saber nada de running.
          </Text>
        </View>
      </View>

      <View style={styles.footer}>
        <Button label="Empezar" onPress={() => navigation.navigate('OnboardingGoal')} />
        <TouchableOpacity activeOpacity={0.7} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.loginLink}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>
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
    paddingHorizontal: spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
  },
  placeholder: {
    width: 200,
    height: 200,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.lg,
    alignSelf: 'center',
  },
  textBlock: {
    gap: 12,
    maxWidth: 320,
    alignItems: 'center',
  },
  headline: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    lineHeight: 32,
    color: colors.ink[900],
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink[500],
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: spacing[4],
    gap: spacing[3],
    alignItems: 'center',
  },
  loginLink: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    color: colors.ink[500],
  },
});
