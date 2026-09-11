import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';

type GlowPos = 'topRight' | 'topLeft';

interface Props {
  glow?: GlowPos;
  glowSize?: number;
  glowOpacity?: number;
}

const BG_GRADIENT = 'linear-gradient(180deg, #1A1B1F 0%, #0D0D0F 45%, #0A0A0C 100%)';

/**
 * Absolute-fill dark gradient + soft corner glow, meant as the first child of a
 * flex:1 screen container (everything else renders on top of it). Web gets the
 * real CSS gradient/blur; native falls back to a flat dark color + soft tint.
 */
export function DarkGlassBackground({ glow = 'topRight', glowSize = 280, glowOpacity = 0.2 }: Props) {
  const glowPos = glow === 'topLeft' ? { top: 40, left: -70 } : { top: 60, right: -60 };
  return (
    <>
      <View
        pointerEvents="none"
        style={[
          styles.layer,
          Platform.OS === 'web' ? ({ backgroundImage: BG_GRADIENT } as any) : { backgroundColor: '#0D0D0F' },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.glow,
          { width: glowSize, height: glowSize, borderRadius: glowSize / 2 },
          glowPos,
          Platform.OS === 'web'
            ? ({
                backgroundImage: `radial-gradient(circle, rgba(143,224,90,${glowOpacity}) 0%, rgba(143,224,90,0) 70%)`,
                filter: 'blur(10px)',
              } as any)
            : { backgroundColor: `rgba(143,224,90,${glowOpacity * 0.5})` },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  layer: { ...StyleSheet.absoluteFillObject },
  glow: { position: 'absolute' },
});
