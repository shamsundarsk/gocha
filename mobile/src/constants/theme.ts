export const Colors = {
  // Background layers
  bg: {
    primary: '#0F0F14',
    secondary: '#16161D',
    card: '#1C1C26',
    cardAlt: '#1E1E2A',
    overlay: 'rgba(15,15,20,0.92)',
    glass: 'rgba(255,255,255,0.05)',
  },

  // Brand
  brand: {
    primary: '#6366F1',    // Indigo
    secondary: '#8B5CF6',  // Purple
    accent: '#06B6D4',     // Cyan
    glow: 'rgba(99,102,241,0.2)',
  },

  // Priority
  priority: {
    critical: '#EF4444',
    high: '#F97316',
    medium: '#6366F1',
    low: '#94A3B8',
  },

  // Status
  status: {
    completed: '#10B981',
    postponed: '#F59E0B',
    cancelled: '#6B7280',
    inProgress: '#6366F1',
  },

  // Text
  text: {
    primary: '#F1F5F9',
    secondary: '#94A3B8',
    tertiary: '#64748B',
    muted: '#475569',
    inverse: '#0F0F14',
  },

  // Semantic
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#06B6D4',

  // Category colors
  category: {
    work: '#6366F1',
    fitness: '#10B981',
    health: '#EF4444',
    learning: '#F59E0B',
    personal: '#8B5CF6',
    social: '#EC4899',
    errands: '#94A3B8',
    creative: '#06B6D4',
    finance: '#22C55E',
    other: '#64748B',
  },

  // Transparent
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
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
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 28,
  '4xl': 32,
  '5xl': 40,
  display: 48,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 24,
    elevation: 10,
  },
  brand: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};
