export const Animation = {
  duration: {
    fast: 150,   // For hover effects, short status changes, fades
    normal: 280, // For page transitions, slide-ins, drawer openings
    slow: 380,   // For larger structural movements, complex morphs
  },
  easing: {
    standard: 'cubic-bezier(0.2, 0, 0, 1)',   // Material standard
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)', // Entering screen
    accelerate: 'cubic-bezier(0.3, 0, 1, 1)', // Exiting screen
  },
} as const;

export default Animation;
