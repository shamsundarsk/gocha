/**
 * Gocha design system
 * Apple-style dark: OLED black canvas, elevated grouped surfaces, one system accent.
 * Spacing follows a 4pt rhythm. Type follows the iOS text ramp.
 */

export const Colors = {
  bg: {
    primary: '#000000',
    secondary: '#0B0B0D',
    card: '#1C1C1E',
    cardBorder: '#2C2C2E',
    elevated: '#2C2C2E',
    overlay: 'rgba(20,20,22,0.98)',
    glass: 'rgba(255,255,255,0.06)',
    glassBorder: 'rgba(255,255,255,0.10)',
    map: '#07070A',
  },

  brand: {
    primary: '#0A84FF',
    secondary: '#5AC8FA',
    soft: '#007AFF',
    glow: 'rgba(10,132,255,0.14)',
    glowStrong: 'rgba(10,132,255,0.28)',
  },

  accent: {
    teal: '#30D158',
    amber: '#FF9F0A',
    rose: '#FF453A',
    sky: '#64D2FF',
    lime: '#A6E22E',
    violet: '#BF5AF2',
    orange: '#FF9F0A',
  },

  emotion: {
    spark: '#0A84FF',
    move: '#30D158',
    nudge: '#FF9F0A',
    snap: '#64D2FF',
  },

  priority: {
    critical: '#FF453A',
    high: '#FF9F0A',
    medium: '#0A84FF',
    low: '#8E8E93',
  },

  status: {
    completed: '#30D158',
    postponed: '#FF9F0A',
    cancelled: '#636366',
    inProgress: '#0A84FF',
  },

  text: {
    primary: '#FFFFFF',
    secondary: '#A1A1A6',
    tertiary: '#8E8E93',
    muted: '#7C7C80',
    dim: '#48484A',
  },

  success: '#30D158',
  warning: '#FF9F0A',
  error: '#FF453A',

  category: {
    work: '#0A84FF',
    fitness: '#30D158',
    health: '#FF453A',
    learning: '#FF9F0A',
    personal: '#BF5AF2',
    social: '#FF375F',
    errands: '#8E8E93',
    creative: '#64D2FF',
    finance: '#30D158',
    other: '#636366',
  },

  separator: 'rgba(84,84,88,0.62)',
  fill: 'rgba(120,120,128,0.20)',
  fillStrong: 'rgba(120,120,128,0.28)',

  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

/** Functional gradients only: photo scrims and subtle brand wash. */
export const Gradient = {
  brand: ['#5AC8FA', '#0A84FF'] as const,
  brandSoft: ['rgba(10,132,255,0.18)', 'rgba(10,132,255,0.00)'] as const,
  hero: ['#1C1C1E', '#101012', '#000000'] as const,
  spark: ['#0A1A2A', '#0B0B0D'] as const,
  move: ['#0E2A1F', '#0B0B0D'] as const,
  nudge: ['#2A1F0E', '#0B0B0D'] as const,
  snap: ['#0E1A2A', '#0B0B0D'] as const,
  mapFade: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)', 'rgba(0,0,0,0.96)'] as const,
  photo: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.30)', 'rgba(0,0,0,0.88)'] as const,
  gold: ['#FFD60A', '#FF9F0A'] as const,
  teal: ['#30D158', '#25A244'] as const,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const Radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  '2xl': 28,
  '3xl': 34,
  full: 9999,
};

export const FontSize = {
  xs: 13,
  sm: 15,
  base: 17,
  md: 17,
  lg: 20,
  xl: 22,
  '2xl': 28,
  '3xl': 34,
  '4xl': 40,
  '5xl': 48,
  display: 56,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
  black: '900' as const,
};

/**
 * iOS text styles. Spread these into Text styles to keep type consistent.
 * `letterSpacing` is tightened for large sizes, as iOS does.
 */
export const Type = {
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.6,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.5,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: FontWeight.bold,
    letterSpacing: -0.35,
  },
  title3: {
    fontSize: 20,
    lineHeight: 25,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.3,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: FontWeight.semibold,
    letterSpacing: -0.2,
  },
  body: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: FontWeight.regular,
    letterSpacing: -0.2,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: FontWeight.regular,
    letterSpacing: -0.15,
  },
  subhead: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: FontWeight.regular,
    letterSpacing: -0.1,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: FontWeight.regular,
  },
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: FontWeight.regular,
  },
};

/** Motion: short, eased, no bounce except for direct manipulation. */
export const Motion = {
  pressScale: 0.975,
  fast: 140,
  base: 220,
  slow: 340,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 3,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.55,
    shadowRadius: 34,
    elevation: 14,
  },
  brand: {
    shadowColor: '#0A84FF',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 18,
    elevation: 8,
  },
  teal: {
    shadowColor: '#30D158',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
};
