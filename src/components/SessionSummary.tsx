import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, spacing, radius } from '../theme';

type Variant = 'paused' | 'complete';

interface Props {
  variant: Variant;
  title: string;
  subtitle?: string;
  stats: { value: string; label: string }[];
  /** Dark surface for use over dark screens (e.g. the training tracker). */
  dark?: boolean;
}

function Glyph({ variant, dark }: { variant: Variant; dark?: boolean }) {
  const strokeColor = dark ? '#8FE05A' : colors.brand[600];
  if (Platform.OS === 'web') {
    return (
      <View style={[styles.iconCircle, dark && styles.iconCircleDark]}>
        {/* @ts-ignore web-only SVG */}
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {variant === 'complete' ? (
            // @ts-ignore
            <path
              d="M 6 16 L 13 23 L 26 9"
              stroke={strokeColor}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <>
              {/* @ts-ignore */}
              <path d="M 12 7 L 12 25" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" />
              {/* @ts-ignore */}
              <path d="M 20 7 L 20 25" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" />
            </>
          )}
        </svg>
      </View>
    );
  }
  return (
    <View style={[styles.iconCircle, dark && styles.iconCircleDark]}>
      <Text style={{ fontSize: 24 }}>{variant === 'complete' ? '✓' : '⏸'}</Text>
    </View>
  );
}

/** Shared layout for the post-run and paused screens: icon → title → subtitle → stat grid. */
export function SessionSummary({ variant, title, subtitle, stats, dark = false }: Props) {
  return (
    <View style={styles.wrap}>
      <Glyph variant={variant} dark={dark} />
      <Text style={[styles.title, dark && styles.titleDark]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, dark && styles.subtitleDark]}>{subtitle}</Text> : null}
      <View style={[styles.statGrid, stats.length > 2 && styles.statGridWrap]}>
        {stats.map((s, i) => (
          <View key={i} style={[styles.statBox, dark && styles.statBoxDark, stats.length > 2 && styles.statBoxHalf]}>
            <Text style={[styles.statValue, dark && styles.statValueDark]}>{s.value}</Text>
            <Text style={[styles.statLabel, dark && styles.statLabelDark]}>{s.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignSelf: 'stretch', alignItems: 'center', gap: spacing[3] },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.brand[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  iconCircleDark: {
    backgroundColor: 'rgba(143,224,90,0.14)',
  },
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: colors.ink[900], textAlign: 'center' },
  titleDark: { color: '#FFFFFF' },
  subtitle: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 16,
    color: colors.ink[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  subtitleDark: { color: '#9A9A9F' },
  statGrid: { flexDirection: 'row', alignSelf: 'stretch', gap: spacing[3], marginTop: spacing[1] },
  statGridWrap: { flexWrap: 'wrap' },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing[4],
    alignItems: 'center',
    gap: 6,
  },
  statBoxDark: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)' },
  statBoxHalf: { flexBasis: '45%', flexGrow: 1 },
  statValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: colors.ink[900] },
  statValueDark: { color: '#FFFFFF' },
  statLabel: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 10.5,
    color: colors.ink[500],
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statLabelDark: { color: '#9A9A9F' },
});
