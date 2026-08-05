/** Glassmorphism tokens from SEC Design Guide v3.0 */
export const Glass = {
  fill: 'rgba(255, 255, 255, 0.10)',
  fillLight: 'rgba(255, 255, 255, 0.16)',
  fillMedium: 'rgba(255, 255, 255, 0.22)',
  fillSubtle: 'rgba(255, 255, 255, 0.06)',
  border: 'rgba(255, 255, 255, 0.20)',
  borderDim: 'rgba(255, 255, 255, 0.12)',
  redFill: 'rgba(196, 18, 48, 0.18)',
  redBorder: 'rgba(196, 18, 48, 0.35)',
} as const;

export const DarkSurface = {
  background: '#0E1525',
  backgroundDeep: '#060D1C',
  backgroundGradient: ['#111B30', '#0E1525', '#060D1C'] as const,
  textPrimary: '#FFFFFF',
  textSecondary: '#D0D8EE',
  textMuted: '#7A85A0',
  silver: '#B0B8CC',
} as const;

export default Glass;
