import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../theme';

interface Props {
  step: number;
  totalSteps: number;
}

export function ProgressSteps({ step, totalSteps }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: totalSteps }, (_, i) => {
        const index = i + 1;
        if (index === step) {
          return <View key={i} style={styles.active} />;
        }
        if (index < step) {
          return <View key={i} style={styles.done} />;
        }
        return <View key={i} style={styles.inactive} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  active: {
    width: 18,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.brand[500],
  },
  done: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.brand[500],
  },
  inactive: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: colors.borderDefault,
  },
});
