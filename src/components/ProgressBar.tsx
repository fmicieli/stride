import React from 'react';
import { View, StyleSheet } from 'react-native';

interface Props {
  progress: number; // 0 to 1
  height?: number;
  backgroundColor?: string;
  fillColor?: string;
  borderRadius?: number;
}

export function ProgressBar({
  progress,
  height = 4,
  backgroundColor = '#E8E8E8',
  fillColor = '#111111',
  borderRadius = 2,
}: Props) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  return (
    <View style={[styles.track, { height, backgroundColor, borderRadius }]}>
      <View
        style={[
          styles.fill,
          { width: `${clampedProgress * 100}%`, backgroundColor: fillColor, borderRadius },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: '100%',
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
});
