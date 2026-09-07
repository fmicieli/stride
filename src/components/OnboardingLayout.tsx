import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ProgressBar } from './ProgressBar';
import { PrimaryButton } from './PrimaryButton';

interface Props {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  canContinue: boolean;
  onContinue: () => void;
  continueLabel?: string;
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
  children,
}: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <ProgressBar progress={step / totalSteps} height={4} />
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
          <PrimaryButton
            label={continueLabel}
            onPress={onContinue}
            disabled={!canContinue}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 32,
    paddingBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '500',
    color: '#111111',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    marginBottom: 32,
  },
  options: {
    gap: 12,
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
  },
});
