/**
 * ClearPress AI - Animation Configuration
 * Precision Clarity Design System
 *
 * Spring-based animation configs for consistent motion throughout the app.
 * Uses CSS variables defined in index.css for timing.
 */

// ===== Timing Constants =====
export const DURATION = {
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
  ring: 800,
} as const;

// ===== Easing Functions =====
export const EASING = {
  // Spring - bouncy, playful feel for interactive elements
  spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
  // Out - smooth deceleration for entrances
  out: 'cubic-bezier(0.16, 1, 0.3, 1)',
  // In-out - balanced for state changes
  inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  // Linear - for continuous animations
  linear: 'linear',
} as const;

// ===== CSS Transition Presets =====
export const transitions = {
  // Quick color/opacity changes
  fast: `all ${DURATION.fast}ms ${EASING.out}`,
  // Standard transitions
  normal: `all ${DURATION.normal}ms ${EASING.out}`,
  // Slower, more deliberate
  slow: `all ${DURATION.slow}ms ${EASING.out}`,
  // Spring-based for interactive
  spring: `all ${DURATION.normal}ms ${EASING.spring}`,
  // Transform only
  transform: `transform ${DURATION.fast}ms ${EASING.out}`,
  // Opacity only
  opacity: `opacity ${DURATION.normal}ms ${EASING.out}`,
  // Colors only
  colors: `background-color ${DURATION.fast}ms ${EASING.out}, border-color ${DURATION.fast}ms ${EASING.out}, color ${DURATION.fast}ms ${EASING.out}`,
} as const;

// ===== Animation Variants (for Framer Motion / CSS) =====
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: DURATION.normal / 1000, ease: [0.16, 1, 0.3, 1] },
};

export const fadeUp = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: DURATION.slow / 1000, ease: [0.34, 1.56, 0.64, 1] },
};

export const fadeDown = {
  initial: { opacity: 0, y: -8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
  transition: { duration: DURATION.slow / 1000, ease: [0.34, 1.56, 0.64, 1] },
};

export const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
  transition: { duration: DURATION.normal / 1000, ease: [0.34, 1.56, 0.64, 1] },
};

export const slideInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: DURATION.slow / 1000, ease: [0.16, 1, 0.3, 1] },
};

export const slideInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: DURATION.slow / 1000, ease: [0.16, 1, 0.3, 1] },
};

// ===== Stagger Configuration =====
export const stagger = {
  fast: 0.03,
  normal: 0.05,
  slow: 0.08,
} as const;

export const staggerContainer = (staggerDelay = stagger.normal) => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay,
    },
  },
});

// ===== Spring Physics (for Framer Motion) =====
export const springConfig = {
  // Gentle - for subtle movements
  gentle: { type: 'spring', stiffness: 120, damping: 14 },
  // Snappy - for quick responses
  snappy: { type: 'spring', stiffness: 400, damping: 30 },
  // Bouncy - for playful interactions
  bouncy: { type: 'spring', stiffness: 300, damping: 10 },
  // Smooth - for elegant transitions
  smooth: { type: 'spring', stiffness: 200, damping: 20 },
} as const;

// ===== Hover/Press States =====
export const cardHover = {
  rest: {
    y: 0,
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.02)',
  },
  hover: {
    y: -2,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.04)',
  },
  pressed: {
    scale: 0.98,
  },
};

export const buttonPress = {
  rest: { scale: 1 },
  pressed: { scale: 0.97 },
};

// ===== Circular Progress Animation =====
export const circularProgress = {
  // Calculate stroke-dashoffset for a given percentage
  getOffset: (percentage: number, circumference: number): number => {
    return circumference - (percentage / 100) * circumference;
  },
  // Animation timing
  duration: DURATION.ring,
  easing: EASING.out,
};

// ===== Tab Indicator Animation =====
export const tabIndicator = {
  transition: {
    type: 'spring',
    stiffness: 500,
    damping: 30,
  },
};

// ===== Reduced Motion Hook Helper =====
export const getReducedMotionStyles = (prefersReducedMotion: boolean) => {
  if (prefersReducedMotion) {
    return {
      transition: 'none',
      animation: 'none',
    };
  }
  return {};
};

// ===== CSS Class Helpers =====
export const animationClasses = {
  fadeIn: 'animate-fade-in',
  fadeUp: 'animate-fade-up',
  fadeDown: 'animate-fade-down',
  scaleIn: 'animate-scale-in',
  ring: 'animate-ring',
  pulse: 'animate-pulse-subtle',
  count: 'animate-count',
  spring: 'animate-spring',
  stagger: 'stagger-children',
} as const;

// ===== Delay Utilities =====
export const delay = (index: number, baseDelay = 50): number => index * baseDelay;

export const getDelayStyle = (index: number, baseDelay = 50): React.CSSProperties => ({
  animationDelay: `${delay(index, baseDelay)}ms`,
});
