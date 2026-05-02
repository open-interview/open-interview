import React, { useRef, useState, useEffect } from "react";
import { motion, useInView as framerUseInView, useScroll, useSpring, AnimatePresence } from "framer-motion";

// Hooks
export const useScrollAnimation = () => {
  const { scrollY } = useScroll();
  const [scrollData, setScrollData] = useState({ y: 0, progress: 0 });

  useEffect(() => {
    const updateScroll = () => {
      const y = scrollY.get();
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? y / totalHeight : 0;
      setScrollData({ y, progress });
    };
    const unsubscribe = scrollY.on("change", updateScroll);
    return () => unsubscribe();
  }, [scrollY]);

  return scrollData;
};

export const useInView = (ref: React.RefObject<HTMLElement>, options = {}) => {
  return framerUseInView(ref, {
    threshold: 0.1,
    triggerOnce: true,
    ...options,
  });
};

export const useMousePosition = () => {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return position;
};

// Animation Components
export const FadeIn: React.FC<{ children: React.ReactNode; delay?: number; duration?: number; className?: string }> = ({ children, delay = 0, duration = 0.5, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      transition={{ duration, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const SlideUp: React.FC<{ children: React.ReactNode; delay?: number; duration?: number; yOffset?: number; className?: string }> = ({ children, delay = 0, duration = 0.5, yOffset = 20, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: yOffset }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const SlideIn: React.FC<{ children: React.ReactNode; direction?: "left" | "right"; xOffset?: number; delay?: number; duration?: number; className?: string }> = ({ children, direction = "left", xOffset = 20, delay = 0, duration = 0.5, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  const x = direction === "left" ? -xOffset : xOffset;
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x }}
      animate={isInView ? { opacity: 1, x: 0 } : {}}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const ScaleIn: React.FC<{ children: React.ReactNode; delay?: number; duration?: number; scaleFrom?: number; className?: string }> = ({ children, delay = 0, duration = 0.5, scaleFrom = 0.8, className = "" }) => {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref);
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: scaleFrom }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export const StaggerContainer: React.FC<{ children: React.ReactNode; staggerDelay?: number; className?: string }> = ({ children, staggerDelay = 0.1, className = "" }) => {
  const variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: staggerDelay } },
  };
  return (
    <motion.div variants={variants} initial="hidden" animate="show" className={className}>
      {children}
    </motion.div>
  );
};

export const AnimatedCounter: React.FC<{ target: number; duration?: number; className?: string }> = ({ target, duration = 2, className = "" }) => {
  const count = useSpring(0, { stiffness: 100, damping: 30 });
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref);
  useEffect(() => { if (isInView) count.set(target); }, [isInView, target, count]);
  return <motion.span ref={ref} className={className}>{Math.floor(count.get())}</motion.span>;
};

export const TypingEffect: React.FC<{ text: string; speed?: number; delay?: number; className?: string }> = ({ text, speed = 50, delay = 0, className = "" }) => {
  const [displayedText, setDisplayedText] = useState("");
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref);
  useEffect(() => {
    if (!isInView) return;
    let i = 0;
    const timeout = setTimeout(() => {
      const interval = setInterval(() => {
        if (i < text.length) {
          setDisplayedText(text.slice(0, i + 1));
          i++;
        } else clearInterval(interval);
      }, speed);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timeout);
  }, [isInView, text, speed, delay]);
  return (
    <span ref={ref} className={className}>
      {displayedText}
      <span className="animate-blink">|</span>
    </span>
  );
};

export const GradientShift: React.FC<{ children: React.ReactNode; colors?: string[]; angle?: number; duration?: number; className?: string }> = ({ children, colors = ["#3b82f6", "#8b5cf6", "#ec4899"], angle = 45, duration = 10, className = "" }) => (
  <motion.div
    className={className}
    animate={{
      backgroundImage: [
        `linear-gradient(${angle}deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
        `linear-gradient(${angle}deg, ${colors[1]} 0%, ${colors[2]} 100%)`,
        `linear-gradient(${angle}deg, ${colors[2]} 0%, ${colors[0]} 100%)`,
        `linear-gradient(${angle}deg, ${colors[0]} 0%, ${colors[1]} 100%)`,
      ],
    }}
    transition={{ duration, repeat: Infinity, ease: "linear" }}
  >
    {children}
  </motion.div>
);

export const FloatingOrb: React.FC<{ size?: number; color?: string; blur?: string; className?: string }> = ({ size = 100, color = "bg-blue-500/30", blur = "blur-xl", className = "" }) => (
  <motion.div
    className={`rounded-full ${color} ${blur} absolute ${className}`}
    style={{ width: size, height: size }}
    animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.1, 1] }}
    transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
  />
);

export const ScrollProgress: React.FC<{ color?: string; height?: number }> = ({ color = "bg-blue-500", height = 4 }) => {
  const { scrollYProgress } = useScroll();
  return (
    <motion.div
      className={`fixed top-0 left-0 right-0 z-50 ${color}`}
      style={{ height, scaleX: scrollYProgress, transformOrigin: "left" }}
    />
  );
};

// Page Transitions
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

export const RouteTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={window.location.pathname}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);
