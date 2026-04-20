import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

interface PageTransitionProps {
  children: React.ReactNode;
  locationKey: string;
}

export function PageTransition({ children, locationKey }: PageTransitionProps) {
  const reduced = useReducedMotion();

  const variants = reduced
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: "easeOut" as const } },
        exit: { opacity: 0, y: -8, transition: { duration: 0.15, ease: "easeIn" as const } },
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
