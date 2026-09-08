import React from 'react';
import { Platform, Text } from 'react-native';
import { colors } from '../theme';

export type IconName =
  | 'eye'
  | 'eye-off'
  | 'chevron'
  | 'chevron-left'
  | 'check'
  | 'bell'
  | 'pin'
  | 'trophy';

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
};

const FALLBACK: Record<IconName, string> = {
  eye: '👁',
  'eye-off': '🚫',
  chevron: '›',
  'chevron-left': '‹',
  check: '✓',
  bell: '🔔',
  pin: '📍',
  trophy: '🏆',
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
