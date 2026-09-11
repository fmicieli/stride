import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  View,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { colors, controlSize, radius, spacing, borderWidth } from '../theme';
import { dg } from './darkGlassTokens';

export type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'tertiaryDanger' | 'ghost';
export type ButtonSize = 'md' | 'sm';

interface Props {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  iconLeft?: React.ReactNode;
  fullWidth?: boolean;
  /** Dark surface for use over dark/glass screens. */
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
}

const TEXT_ONLY = new Set<ButtonVariant>(['tertiary', 'tertiaryDanger']);

export function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  iconLeft,
  fullWidth = true,
  dark = false,
  style,
}: Props) {
  const textOnly = TEXT_ONLY.has(variant);
  const height = textOnly ? 36 : size === 'sm' ? controlSize.sm : controlSize.lg;
  const labelColor = dark
    ? variant === 'primary'
      ? dg.ctaText
      : variant === 'tertiaryDanger'
      ? dg.danger
      : variant === 'tertiary' || variant === 'ghost'
      ? dg.ink500
      : dg.ink900
    : variant === 'primary'
    ? colors.surface
    : variant === 'tertiaryDanger'
    ? colors.error.solid
    : variant === 'tertiary' || variant === 'ghost'
    ? colors.ink[700]
    : colors.ink[900];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        styles.base,
        { height },
        textOnly ? styles.textOnly : styles.solidBase,
        variant === 'primary' && (dark ? styles.primaryDark : styles.primary),
        variant === 'secondary' && (dark ? styles.secondaryDark : styles.secondary),
        !textOnly && (fullWidth ? styles.full : styles.auto),
        (disabled || loading) && !textOnly && styles.disabled,
        (disabled || loading) && textOnly && styles.disabledText,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? (dark ? dg.ctaText : colors.surface) : dark ? dg.accent : colors.brand[500]}
          size="small"
        />
      ) : (
        <View style={styles.row}>
          {iconLeft ? <View style={styles.icon}>{iconLeft}</View> : null}
          <Text
            style={[
              styles.label,
              { color: labelColor, fontSize: size === 'sm' || textOnly ? 15 : 16 },
            ]}
          >
            {label}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidBase: {
    paddingHorizontal: spacing[6],
  },
  textOnly: {
    paddingHorizontal: spacing[3],
    alignSelf: 'center',
  },
  full: { width: '100%' },
  auto: { alignSelf: 'flex-start' },
  primary: {
    backgroundColor: colors.brand[500],
  },
  primaryDark: {
    backgroundColor: dg.accent,
  },
  secondary: {
    backgroundColor: colors.surface,
    borderWidth: borderWidth.strong,
    borderColor: colors.ink[900],
  },
  secondaryDark: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: borderWidth.strong,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  disabled: { opacity: 0.4 },
  disabledText: { opacity: 0.4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing[2] },
  icon: { alignItems: 'center', justifyContent: 'center' },
  label: {
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
});
