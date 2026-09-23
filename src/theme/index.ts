import { colors } from './colors';

export { colors };

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

export const font = {
  sizeXs: 12,
  sizeSm: 14,
  sizeMd: 16,
  sizeLg: 20,
  sizeXl: 26,
  size2xl: 32,
  weightRegular: '400' as const,
  weightMedium: '600' as const,
  weightBold: '800' as const,
};

/** Gradiente da marca — usar com expo-linear-gradient */
export const gradiente = {
  marca: [colors.primary, colors.primaryDeep] as const,
  marcaSuave: ['#F58A4B', colors.primaryDark] as const,
};

export const shadow = {
  sm: {
    shadowColor: '#6B3410',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#6B3410',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: '#6B3410',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 8,
  },
  /** compat: usos antigos de `shadow.card` */
  card: {
    shadowColor: '#6B3410',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
};
