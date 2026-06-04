import { type Variants, type Transition } from 'framer-motion';

export const springTransition: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
  mass: 1,
};

export const springTransitionBounce: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 15,
  mass: 1,
};

export const springStiff: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
};

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 20,
};

export const springFast: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 0.8,
};

export const staggerConfig = {
  staggerChildren: 0.08,
  delayChildren: 0,
} as const;

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -4 },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export const fadeUpSlow: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

export const fadeUpScale: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  },
};

export const scaleFade: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

export const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};

export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0 },
  },
};

export const containerVariantsDelay: Variants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.1 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export const itemFade: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0 },
};

export function getContentVariants(direction: number): Variants {
  return {
    enter: { x: direction > 0 ? 300 : -300, opacity: 0, scale: 0.95 },
    center: { x: 0, opacity: 1, scale: 1 },
    exit: { x: direction < 0 ? 300 : -300, opacity: 0, scale: 0.95 },
  };
}
