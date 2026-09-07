import React from 'react';
import { Platform, Text } from 'react-native';

interface Props {
  name: string;
  focused: boolean;
  activeColor: string;
  inactiveColor: string;
}

export function TabIcon({ name, focused, activeColor, inactiveColor }: Props) {
  const color = focused ? activeColor : inactiveColor;
  const size = 20;

  if (Platform.OS === 'web') {
    if (name === 'Hoy') {
      return (
        // @ts-ignore
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Roof */}
          {/* @ts-ignore */}
          <path d="M 3.33 9.17 L 10 3.33 L 16.67 9.17" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          {/* Walls */}
          {/* @ts-ignore */}
          <path d="M 5 8.33 L 5 16.67 L 15 16.67 L 15 8.33" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
    if (name === 'Progreso') {
      return (
        // @ts-ignore
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Bar 1 (medium) */}
          {/* @ts-ignore */}
          <line x1="4.17" y1="16.67" x2="4.17" y2="8.33" stroke={color} strokeWidth="1.75" strokeLinecap="round"/>
          {/* Bar 2 (tall) */}
          {/* @ts-ignore */}
          <line x1="10" y1="16.67" x2="10" y2="3.33" stroke={color} strokeWidth="1.75" strokeLinecap="round"/>
          {/* Bar 3 (short) */}
          {/* @ts-ignore */}
          <line x1="15.83" y1="16.67" x2="15.83" y2="10.83" stroke={color} strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
      );
    }
    if (name === 'Perfil') {
      return (
        // @ts-ignore
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Head circle */}
          {/* @ts-ignore */}
          <circle cx="10" cy="6.67" r="3.33" stroke={color} strokeWidth="1.75"/>
          {/* Shoulders arc */}
          {/* @ts-ignore */}
          <path d="M 3.33 17.5 C 3.33 13.83 6.33 11.67 10 11.67 C 13.67 11.67 16.67 13.83 16.67 17.5" stroke={color} strokeWidth="1.75" strokeLinecap="round"/>
        </svg>
      );
    }
  }

  const fallbacks: Record<string, string> = { Hoy: '⌂', Progreso: '▦', Perfil: '○' };
  return (
    <Text style={{ fontSize: 18, color, lineHeight: 22 }}>
      {fallbacks[name] ?? '•'}
    </Text>
  );
}
