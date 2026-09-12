import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ProgressSteps } from './ProgressSteps';
import { Button } from './Button';
import { Icon } from './Icon';
import { spacing } from '../theme';

const BG = '#0D0D0F';
const TEXT = '#FFFFFF';
const TEXT_MUTED = '#9A9A9F';

interface Props {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  canContinue: boolean;
  onContinue: () => void;
  continueLabel?: string;
  secondaryLabel?: string;
  onSecondary?: () => void;
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
  secondaryLabel,
  onSecondary,
  hideBack,
  children,
}: Props) {
  const navigation = useNavigation();
  const showBack = !(hideBack ?? step === 1);

  const enter = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(enter, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, []);
  const enterStyle = {
    opacity: enter,
    transform: [{ translateX: enter.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }],
  };

  return (
    <View style={styles.root}>
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
                <Icon name="chevron-left" size={22} color={TEXT} />
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
            <Animated.View style={enterStyle}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.subtitle}>{subtitle}</Text>
              <View style={styles.options}>{children}</View>
            </Animated.View>
          </ScrollView>

          <View style={styles.footer}>
            <Button label={continueLabel} onPress={onContinue} disabled={!canContinue} dark />
            {secondaryLabel && onSecondary ? (
              <Button label={secondaryLabel} variant="tertiary" onPress={onSecondary} dark />
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  safe: { flex: 1 },
  flex: { flex: 1 },
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
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing[4],
    paddingTop: spacing[5],
    paddingBottom: spacing[4],
  },
  title: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 24,
    lineHeight: 30,
    color: TEXT,
    marginBottom: spacing[2],
  },
  subtitle: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
    lineHeight: 22,
    color: TEXT_MUTED,
    marginBottom: spacing[5],
  },
  options: { gap: spacing[3] },
  footer: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[4],
    paddingTop: spacing[4],
    backgroundColor: BG,
    gap: spacing[2],
  },
});
