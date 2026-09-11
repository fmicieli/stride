import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Platform, Animated, Easing } from 'react-native';

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

/**
 * Circular progress indicator — animated arc draw-in on web (real SVG +
 * CSS transition), a soft fade/scale-in on native (flat ring, no true arc).
 */
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
  const target = Math.max(0, Math.min(1, progress));

  // Web: animate from 0 to the real value right after first paint, and again
  // whenever `progress` changes — driven by a CSS transition on the arc.
  const [webProgress, setWebProgress] = useState(0);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    setWebProgress(0);
    const raf = requestAnimationFrame(() => setWebProgress(target));
    return () => cancelAnimationFrame(raf);
  }, [target]);
  const dash = circumference * webProgress;

  // Native: no true arc, so give the ring a small entrance instead.
  const mount = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (Platform.OS === 'web') return;
    const anim = Animated.timing(mount, { toValue: 1, duration: 500, easing: Easing.out(Easing.cubic), useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [mount]);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {Platform.OS === 'web' ? (
        // @ts-ignore — web-only SVG
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ position: 'absolute' }}>
          {/* @ts-ignore */}
          <circle cx={c} cy={c} r={r} stroke={trackColor} strokeWidth={strokeWidth} fill="none" />
          {/* @ts-ignore */}
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
            style={{ transition: 'stroke-dasharray 900ms cubic-bezier(0.4,0,0.2,1)' }}
          />
        </svg>
      ) : (
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: trackColor,
              opacity: mount,
              transform: [{ scale: mount.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
            },
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
