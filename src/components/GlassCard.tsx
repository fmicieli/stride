import React from 'react';
import { View, StyleSheet, Platform, ViewStyle, StyleProp } from 'react-native';

type Variant = 'primary' | 'secondary' | 'ghost';

interface Props {
  variant?: Variant;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
}

const WEB_BLUR: Record<Variant, number> = { primary: 24, secondary: 18, ghost: 10 };

/**
 * Dark-theme glass surface (Hoy / Progreso / Logros / Mi plan). `primary` is the
 * hero-card treatment (subtle gradient + border + shadow); `secondary` is for
 * smaller stat/list cards; `ghost` is for icon buttons with no border/shadow.
 * True backdrop blur is web-only (CSS `backdrop-filter`); native falls back to
 * a flat translucent fill, which reads fine over the dark background.
 */
export function GlassCard({ variant = 'secondary', style, children }: Props) {
  const webBlurStyle =
    Platform.OS === 'web'
      ? ({
          backdropFilter: `blur(${WEB_BLUR[variant]}px)`,
          WebkitBackdropFilter: `blur(${WEB_BLUR[variant]}px)`,
        } as any)
      : null;
  const webFill =
    Platform.OS === 'web' && variant === 'primary'
      ? ({ backgroundImage: 'linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))' } as any)
      : null;

  return <View style={[styles[variant], webBlurStyle, webFill, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  primary: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.4,
    shadowRadius: 36,
    elevation: 8,
  },
  secondary: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  ghost: {
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
});
