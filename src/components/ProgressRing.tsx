import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface Props {
  size: number;
  strokeWidth?: number;
  progress: number; // 0..1
  trackColor: string;
  arcColor: string;
  centerLabel?: string;
  centerSub?: string;
  labelColor?: string;
  subColor?: string;
}

/** Circular progress indicator — full SVG arc on web, a flat ring fallback on native. */
export function ProgressRing({
  size,
  strokeWidth = 8,
  progress,
  trackColor,
  arcColor,
  centerLabel,
  centerSub,
  labelColor = '#FFFFFF',
  subColor = '#9A9A9F',
}: Props) {
  const r = (size - strokeWidth) / 2;
  const c = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, progress));
  const dash = circumference * pct;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Platform.OS === 'web' ? (
        // @ts-ignore — web-only SVG
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
          {/* @ts-ignore */}
          <circle cx={c} cy={c} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
          {pct > 0.002 && (
            // @ts-ignore
            <circle
              cx={c}
              cy={c}
              r={r}
              stroke={arcColor}
              strokeWidth={strokeWidth}
              fill="none"
              strokeDasharray={`${dash} ${circumference}`}
              strokeLinecap="round"
              transform={`rotate(-90 ${c} ${c})`}
            />
          )}
        </svg>
      ) : (
        <View
          style={[
            StyleSheet.absoluteFillObject,
            { borderRadius: size / 2, borderWidth: strokeWidth, borderColor: trackColor },
          ]}
        />
      )}
      {(centerLabel || centerSub) && (
        <View style={styles.center}>
          {centerLabel ? (
            <Text style={[styles.label, { color: labelColor, fontSize: size >= 80 ? 18 : 13 }]}>{centerLabel}</Text>
          ) : null}
          {centerSub ? <Text style={[styles.sub, { color: subColor }]}>{centerSub}</Text> : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center' },
  label: { fontFamily: 'PlusJakartaSans-Bold' },
  sub: { fontFamily: 'PlusJakartaSans-Bold', fontSize: 9, letterSpacing: 0.5, marginTop: 2, textTransform: 'uppercase' },
});
