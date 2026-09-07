export const colors = {
  brand: {
    50: '#EAF7F1',
    100: '#D3EEE1',
    200: '#A8DDC4',
    300: '#7CCBA8',
    400: '#54B98D',
    500: '#1E8563',
    600: '#1B6E52',
    700: '#134A37',
    800: '#0D3527',
  },
  ink: {
    900: '#111111',
    700: '#555555',
    600: '#666666',
    500: '#777777',
    400: '#8A8A8A',
    300: '#999999',
  },
  surface: '#FFFFFF',
  surfaceMuted: '#F4F4F4',
  surfaceSunken: '#ECECEC',
  borderDefault: '#DDDDDD',
  borderSubtle: '#CCCCCC',
  success: {
    text: '#1B6E52',
    bg: '#EAF7F1',
    border: '#A8DDC4',
  },
  warning: {
    text: '#8A4600',
    bg: '#FDECD2',
    border: '#F3CE96',
  },
  error: {
    text: '#B3261E',
    bg: '#FBEAE8',
    border: '#F1B9B3',
    solid: '#B3261E',
  },
  info: {
    text: '#1E40AF',
    bg: '#E8EFFD',
    border: '#BFD1F7',
  },
  scrim: 'rgba(15, 17, 16, 0.52)',
};

export const font = {
  family: 'PlusJakartaSans',
  weight: {
    regular: '400' as const,
    medium: '500' as const,
    semiBold: '600' as const,
    bold: '700' as const,
    extraBold: '800' as const,
  },
};

export const typography = {
  displayLg: {
    fontFamily: font.family,
    fontWeight: font.weight.extraBold,
    fontSize: 34,
    lineHeight: 40,
  },
  display: {
    fontFamily: font.family,
    fontWeight: font.weight.bold,
    fontSize: 24,
    lineHeight: 30,
  },
  title: {
    fontFamily: font.family,
    fontWeight: font.weight.bold,
    fontSize: 20,
    lineHeight: 26,
  },
  subtitle: {
    fontFamily: font.family,
    fontWeight: font.weight.semiBold,
    fontSize: 17,
    lineHeight: 24,
  },
  bodyLg: {
    fontFamily: font.family,
    fontWeight: font.weight.semiBold,
    fontSize: 16,
    lineHeight: 24,
  },
  bodyLgRegular: {
    fontFamily: font.family,
    fontWeight: font.weight.regular,
    fontSize: 16,
    lineHeight: 24,
  },
  body: {
    fontFamily: font.family,
    fontWeight: font.weight.regular,
    fontSize: 15,
    lineHeight: 22,
  },
  bodyMedium: {
    fontFamily: font.family,
    fontWeight: font.weight.semiBold,
    fontSize: 15,
    lineHeight: 22,
  },
  bodySm: {
    fontFamily: font.family,
    fontWeight: font.weight.medium,
    fontSize: 13,
    lineHeight: 18,
  },
  bodySmBold: {
    fontFamily: font.family,
    fontWeight: font.weight.bold,
    fontSize: 13,
    lineHeight: 18,
  },
  eyebrow: {
    fontFamily: font.family,
    fontWeight: font.weight.bold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
  },
  navLabel: {
    fontFamily: font.family,
    fontWeight: font.weight.semiBold,
    fontSize: 11,
    lineHeight: 14,
  },
};

export const radius = {
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  full: 999,
};

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 32,
  8: 40,
  9: 48,
  10: 64,
};

export const controlSize = {
  sm: 38,
  md: 44,
  lg: 52,
  xl: 60,
};

export const iconSize = {
  sm: 16,
  md: 20,
  lg: 26,
  xl: 38,
};

export const borderWidth = {
  hairline: 1.5,
  selected: 2,
  strong: 1.75,
  error: 1.5,
};
