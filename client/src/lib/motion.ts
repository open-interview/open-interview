import { Variants, type TargetAndTransition, type Transition } from 'framer-motion';

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25 } },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.25 } },
};

export const DURATION = { micro: 0.15, standard: 0.25, complex: 0.35 } as const;

// ─── Micro-interactions (whileHover / whileTap) ──────────────────────────────

export const springTap: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 20,
  mass: 0.5,
};

export const springHover: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  mass: 0.8,
};

export const microInteractions = {
  card: {
    whileHover: { scale: 1.01, transition: springHover } satisfies TargetAndTransition,
    whileTap: { scale: 0.98, transition: springTap } satisfies TargetAndTransition,
  },
  button: {
    whileHover: { scale: 1.03, transition: springHover } satisfies TargetAndTransition,
    whileTap: { scale: 0.97, transition: springTap } satisfies TargetAndTransition,
  },
  iconButton: {
    whileHover: { scale: 1.05, transition: springHover } satisfies TargetAndTransition,
    whileTap: { scale: 0.95, transition: springTap } satisfies TargetAndTransition,
  },
  press: {
    whileTap: { scale: 0.97, transition: springTap } satisfies TargetAndTransition,
  },
} as const;
