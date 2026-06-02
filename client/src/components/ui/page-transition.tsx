import { AnimatePresence, motion } from "framer-motion"
import { useReducedMotion } from '../../hooks/use-reduced-motion'

interface PageTransitionProps {
  children: React.ReactNode
  locationKey: string
}

const spring = { type: "spring" as const, stiffness: 300, damping: 25, mass: 1 }
const springExit = { type: "spring" as const, stiffness: 400, damping: 30, mass: 0.8 }

export function PageTransition({ children, locationKey }: PageTransitionProps) {
  const reduced = useReducedMotion()

  if (reduced) {
    return <>{children}</>
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={locationKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: spring }}
        exit={{ opacity: 0, y: -8, transition: springExit }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
