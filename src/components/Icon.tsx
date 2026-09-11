import React from 'react';
import { Platform, Text } from 'react-native';
import { colors } from '../theme';

export type IconName =
  | 'eye'
  | 'eye-off'
  | 'chevron'
  | 'chevron-left'
  | 'check'
  | 'close'
  | 'calendar'
  | 'bell'
  | 'pin'
  | 'trophy'
  | 'flame'
  | 'clock'
  | 'route'
  | 'flag'
  | 'trend'
  | 'run'
  | 'moon'
  | 'star';

interface Props {
  name: IconName;
  size?: number;
  color?: string;
}

// Stroke-style paths (24x24 grid) matching the Figma `Icons` set.
const PATHS: Record<IconName, React.ReactNode> = {
  eye: (
    <>
      {/* @ts-ignore */}
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      {/* @ts-ignore */}
      <circle cx="12" cy="12" r="3.25" />
    </>
  ),
  'eye-off': (
    <>
      {/* @ts-ignore */}
      <path d="M4 4l16 16" />
      {/* @ts-ignore */}
      <path d="M9.9 5.2A9.9 9.9 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 3.9M6.3 6.3A17 17 0 0 0 2 12s3.5 7 10 7a9.7 9.7 0 0 0 5.1-1.4" />
      {/* @ts-ignore */}
      <path d="M9.9 9.9a3.25 3.25 0 0 0 4.5 4.5" />
    </>
  ),
  chevron: (
    <>
      {/* @ts-ignore */}
      <path d="M9 5l7 7-7 7" />
    </>
  ),
  'chevron-left': (
    <>
      {/* @ts-ignore */}
      <path d="M15 5l-7 7 7 7" />
    </>
  ),
  check: (
    <>
      {/* @ts-ignore */}
      <path d="M5 13l4 4L19 7" />
    </>
  ),
  close: (
    <>
      {/* @ts-ignore */}
      <path d="M6 6l12 12M18 6L6 18" />
    </>
  ),
  calendar: (
    <>
      {/* @ts-ignore */}
      <path d="M5 6.5h14a2 2 0 0 1 2 2V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8.5a2 2 0 0 1 2-2Z" />
      {/* @ts-ignore */}
      <path d="M3 11h18M8 3.5v4M16 3.5v4" />
    </>
  ),
  bell: (
    <>
      {/* @ts-ignore */}
      <path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5h-15S6 14 6 10Z" />
      {/* @ts-ignore */}
      <path d="M10 18.5a2 2 0 0 0 4 0" />
    </>
  ),
  pin: (
    <>
      {/* @ts-ignore */}
      <path d="M12 21s7-6.2 7-11.5A7 7 0 0 0 5 9.5C5 14.8 12 21 12 21Z" />
      {/* @ts-ignore */}
      <circle cx="12" cy="9.5" r="2.4" />
    </>
  ),
  trophy: (
    <>
      {/* @ts-ignore */}
      <path d="M7 4h10v4a5 5 0 0 1-10 0V4Z" />
      {/* @ts-ignore */}
      <path d="M10 13v3h4v-3M9 20h6" />
      {/* @ts-ignore */}
      <path d="M7 5H4v2a4 4 0 0 0 3.5 4M17 5h3v2a4 4 0 0 1-3.5 4" />
    </>
  ),
  flame: (
    <>
      {/* @ts-ignore */}
      <path d="M12 2.5c1.2 4-2.8 5.6-2.8 9.7A2.8 2.8 0 0 0 12 15a2.8 2.8 0 0 0 2.8-2.8c0-1.2-.6-2-.6-2s2.3 1.3 2.3 4.6A4.5 4.5 0 0 1 12 19.5a4.5 4.5 0 0 1-4.5-4.5C7.5 9.5 12 7.5 12 2.5Z" fill="currentColor" stroke="none" />
    </>
  ),
  clock: (
    <>
      {/* @ts-ignore */}
      <circle cx="12" cy="12" r="9" />
      {/* @ts-ignore */}
      <path d="M12 7.5V12l3.2 2" />
    </>
  ),
  route: (
    <>
      {/* @ts-ignore */}
      <path d="M4.5 18 9.5 7.5 14 15.5 19.5 5.5" />
    </>
  ),
  flag: (
    <>
      {/* @ts-ignore */}
      <path d="M6 3v18" />
      {/* @ts-ignore */}
      <path d="M6 4h11l-2.5 3.5L17 11H6" />
    </>
  ),
  trend: (
    <>
      {/* @ts-ignore */}
      <path d="M4 16.5 10 10.5 13.5 13.5 20 6.5" />
      {/* @ts-ignore */}
      <path d="M14.5 6.5H20V12" />
    </>
  ),
  run: (
    <>
      {/* @ts-ignore */}
      <circle cx="13.5" cy="4.6" r="1.6" fill="currentColor" stroke="none" />
      {/* @ts-ignore */}
      <path d="M9 21l2-5 2.2-2-1-3.4L9.5 12l-2.8 2.2" />
      {/* @ts-ignore */}
      <path d="M11.2 10.2 13 9l1.8 2.6 3 1" />
    </>
  ),
  moon: (
    <>
      {/* @ts-ignore */}
      <path d="M15 3.2a8.8 8.8 0 1 0 5.8 15.4A9 9 0 0 1 15 3.2Z" fill="currentColor" stroke="none" />
    </>
  ),
  star: (
    <>
      {/* @ts-ignore */}
      <path
        d="M12 2.5l2.9 6 6.6.7-4.9 4.4 1.4 6.5L12 16.7l-5.9 3.4 1.4-6.5-4.9-4.4 6.6-.7L12 2.5Z"
        fill="currentColor"
        stroke="none"
      />
    </>
  ),
};

const FALLBACK: Record<IconName, string> = {
  eye: '👁',
  'eye-off': '🚫',
  chevron: '›',
  'chevron-left': '‹',
  check: '✓',
  close: '✕',
  calendar: '📅',
  bell: '🔔',
  pin: '📍',
  trophy: '🏆',
  flame: '🔥',
  clock: '🕐',
  route: '↗',
  flag: '🚩',
  trend: '📈',
  run: '🏃',
  moon: '🌙',
  star: '⭐',
};

export function Icon({ name, size = 20, color = colors.ink[700] }: Props) {
  if (Platform.OS === 'web') {
    return (
      // @ts-ignore — web-only SVG
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke={color}
        style={{ color }}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        {PATHS[name]}
      </svg>
    );
  }
  return <Text style={{ fontSize: size * 0.9, color }}>{FALLBACK[name]}</Text>;
}
