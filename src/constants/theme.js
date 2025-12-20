// src/constants/theme.js
import { Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

export const COLORS = {
  // Primary palette: green tones from Kirayedar24 logo
  primary: '#FDB022',
  // softer light background
  secondary: '#F0FFF4',
  accent: '#FDBF4D',
  danger: '#FF6347',
  text: '#2D3748',
  textSecondary: '#718096',
  white: '#FFFFFF',
  black: '#1A1A1A',
  // gradient from primary green to lighter green
  gradientStart: '#FDB022',
  gradientEnd: '#FDBF4D',
};

export const SIZES = {
  base: 8,
  font: 14,
  radius: 16,
  padding: 24,
  h1: 28,
  h2: 22,
  h3: 16,
  body4: 14,
  width,
  height,
};

export const FONTS = {
  h1: { fontFamily: 'System', fontSize: SIZES.h1, lineHeight: 36, fontWeight: 'bold' },
  h2: { fontFamily: 'System', fontSize: SIZES.h2, lineHeight: 30, fontWeight: 'bold' },
  h3: { fontFamily: 'System', fontSize: SIZES.h3, lineHeight: 22, fontWeight: '600' },
  body: { fontFamily: 'System', fontSize: SIZES.body4, lineHeight: 22, fontWeight: 'normal' },
  caption: { fontFamily: 'System', fontSize: 12, lineHeight: 18, fontWeight: '500' },
};

const appTheme = { COLORS, SIZES, FONTS };

export default appTheme;