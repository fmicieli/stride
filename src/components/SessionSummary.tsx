import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { colors, spacing, radius } from '../theme';

type Variant = 'paused' | 'complete';

interface Props {
  variant: Variant;
  title: string;
  subtitle?: string;
  stats: { value: string; label: string }[];
}

function Glyph({ variant }: { variant: Variant }) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.iconCircle}>
        {/* @ts-ignore web-only SVG */}
        <svg width="30" height="30" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          {variant === 'complete' ? (
            // @ts-ignore
            <path
              d="M 6 16 L 13 23 L 26 9"
              stroke={colors.brand[600]}
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <>
              {/* @ts-ignore */}
              <path d="M 12 7 L 12 25" stroke={colors.brand[600]} strokeWidth="3.5" strokeLinecap="round" />
              {/* @ts-ignore */}
              <path d="M 20 7 L 20 25" stroke={colors.brand[600]} strokeWidth="3.5" strokeLinecap="round" />
            </>
          )}
        </svg>
      </View>
    );
  }
  return (
    <View style={styles.iconCircle}>
      <Text style={{ fontSize: 24 }}>{variant === 'complete' ? '✓' : '⏸'}</Text>
    </View>
  );
}

/** Shared layout for the post-run and paused screens: icon → title → subtitle → stat grid. */
export function SessionSummary({ variant, title, subtitle, stats }: Props) {
  return (
    <View style={styles.wrap}>
      <Glyph variant={variant} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      <View style={styles.statGrid}>
        {stats.map((s, i) => (
          <View key={i} style={styles.statBox}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
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
  title: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 24, color: colors.ink[900], textAlign: 'center' },
  subtitle: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 16,
    color: colors.ink[500],
    textAlign: 'center',
    lineHeight: 22,
  },
  statGrid: { flexDirection: 'row', alignSelf: 'stretch', gap: spacing[3], marginTop: spacing[1] },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.sm,
    padding: spacing[4],
    alignItems: 'center',
    gap: 6,
  },
  statValue: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 20, color: colors.ink[900] },
  statLabel: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 10.5,
    color: colors.ink[500],
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
