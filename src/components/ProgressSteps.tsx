import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';

interface Props {
  step: number; // 1-based current step
  totalSteps: number;
}

const DOT = 6;
const ACTIVE_W = 18;
const DURATION = 260;

// state value per dot: 0 = upcoming, 1 = done, 2 = active
function stateFor(index1: number, step: number) {
  if (index1 === step) return 2;
  if (index1 < step) return 1;
  return 0;
}

export function ProgressSteps({ step, totalSteps }: Props) {
  // Each onboarding step is a fresh screen mount, so seed the drivers with the
  // PREVIOUS step's state and let the effect animate to the current one — the
  // active pill visibly grows / shifts every time a new step comes in.
  const drivers = useRef(
    Array.from({ length: totalSteps }, (_, i) =>
      new Animated.Value(stateFor(i + 1, Math.max(0, step - 1))),
    ),
  ).current;

  useEffect(() => {
    Animated.parallel(
      drivers.map((d, i) =>
        Animated.timing(d, {
          toValue: stateFor(i + 1, step),
          duration: DURATION,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: false,
        }),
      ),
    ).start();
  }, [step, totalSteps]);

  return (
    <View style={styles.row}>
      {drivers.map((d, i) => (
        <Animated.View
          key={i}
          style={{
            height: DOT,
            borderRadius: 999,
            width: d.interpolate({
              inputRange: [0, 1, 2],
              outputRange: [DOT, DOT, ACTIVE_W],
            }),
            backgroundColor: d.interpolate({
              inputRange: [0, 1, 2],
              outputRange: ['rgba(255,255,255,0.15)', 'rgba(143,224,90,0.45)', '#8FE05A'],
            }),
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
