export const Colors = {
  primary: '#1A2744',            // Deep Navy (App Bar, Header, Primary Buttons, Icons, Active Tabs)
  primaryPressed: '#111B30',     // Pressed Deep Navy
  secondaryNavy: '#243260',      // Card/Detail Background Navy
  primaryContainer: '#D0D8EE',   // Light Navy Container

  secondary: '#C41230',          // Crimson (CTA Buttons, FAB, Active Chips, Badges, Notifications)
  secondaryPressed: '#9E0E27',   // Pressed Crimson
  secondaryContainer: '#F9D0D7', // Crimson Container Accent

  background: '#F0F2F7',         // Light Grey Background
  surface: '#FFFFFF',            // Surface Card Background
  error: '#D32F2F',              // Error State

  text: {
    primary: '#0E1525',          // Dark Text
    secondary: '#3A4260',        // Mid Text
    outline: '#7A85A0',          // Muted Outlines/Placeholder
    onDark: '#D0D8EE',           // Light tint on navy backgrounds
    silver: '#B0B8CC',           // Tertiary / steel
  },

  dark: {
    background: '#0E1525',
    backgroundDeep: '#060D1C',
    surface: '#111B30',
  },
} as const;

export default Colors;
