import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ProgressSteps } from './ProgressSteps';
import { Button } from './Button';
import { Icon } from './Icon';
import { colors, spacing } from '../theme';

interface Props {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  canContinue: boolean;
  onContinue: () => void;
  continueLabel?: string;
  /** Hide the back control (first onboarding step). Defaults to hidden on step 1. */
  hideBack?: boolean;
  children: React.ReactNode;
}

export function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  canContinue,
  onContinue,
  continueLabel = 'Continuar',
  hideBack,
  children,
}: Props) {
  const navigation = useNavigation();
  const showBack = !(hideBack ?? step === 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          {showBack ? (
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icon name="chevron-left" size={22} color={colors.ink[900]} />
            </TouchableOpacity>
          ) : (
            <View style={styles.backButton} />
          )}
        </View>

        <View style={styles.progressContainer}>
          <ProgressSteps step={step} totalSteps={totalSteps} />
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
          <View style={styles.options}>{children}</View>
        </ScrollView>

        <View style={styles.footer}>
          <Button label={continueLabel} onPress={onContinue} disabled={!canContinue} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  header: {
    height: 60,
    paddingHorizontal: spacing[4],
    justifyContent: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[1],
    alignItems: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    lineHeight: 30,
    color: colors.ink[900],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink[500],
    marginBottom: spacing[5],
  },
  options: {
    gap: spacing[3],
  },
  footer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: spacing[4],
    backgroundColor: colors.surface,
  },
});
