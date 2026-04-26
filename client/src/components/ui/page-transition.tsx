import { AnimatePresence, motion } from "framer-motion";
import { useReducedMotion, springTransition, springTransitionBounce, getSpringTransition } from '../../hooks/use-reduced-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  locationKey: string;
}

export function PageTransition({ children, locationKey }: PageTransitionProps) {
  const reduced = useReducedMotion();
  const spring = getSpringTransition(reduced);
  const bounce = reduced ? { duration: 0.01 } : springTransitionBounce;

  const variants = reduced
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: spring },
        exit: { opacity: 0, y: -8, transition: bounce },
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={locationKey}
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
