import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation';
import { colors, spacing, radius, controlSize } from '../../theme';

type Nav = StackNavigationProp<RootStackParamList, 'Welcome'>;

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.container}>
        <View style={styles.logoSection}>
          <Text style={styles.logo}>Stride</Text>
          <Text style={styles.tagline}>Tu entrenamiento, a tu ritmo</Text>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('OnboardingGoal')}
          >
            <Text style={styles.primaryButtonText}>Empezar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryButton}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing[4],
    justifyContent: 'space-between',
    paddingTop: spacing[10],
    paddingBottom: spacing[6],
  },
  logoSection: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    fontSize: 40,
    color: colors.ink[900],
    letterSpacing: -1,
    marginBottom: spacing[2],
  },
  tagline: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink[500],
  },
  actionsSection: {
    gap: spacing[3],
  },
  primaryButton: {
    backgroundColor: colors.brand[500],
    borderRadius: radius.md,
    height: controlSize.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: colors.surface,
    fontSize: 16,
  },
  secondaryButton: {
    height: controlSize.lg,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.borderDefault,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: colors.ink[900],
    fontSize: 16,
  },
});
