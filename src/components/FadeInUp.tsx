import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleProp, ViewStyle } from 'react-native';

interface Props {
  delay?: number;
  duration?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

/** Small mount-in animation (fade + slide up) so screens don't feel static. */
export function FadeInUp({ delay = 0, duration = 380, distance = 12, style, children }: Props) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start();
    // Web can throttle rAF-driven Animated values on a hidden/background tab;
    // force the final state so nothing gets stuck mid-fade.
    const settle = setTimeout(() => progress.setValue(1), delay + duration + 400);
    return () => {
      anim.stop();
      clearTimeout(settle);
    };
  }, [delay, duration, progress]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [distance, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
