import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Code2, Terminal, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { CodeWindow } from "@/components/home/CodeWindow";
import { TerminalPanel } from "@/components/home/TerminalPanel";

function ShimmerBadge({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 overflow-hidden"
    >
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-violet-400/25 to-transparent -skew-x-12"
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
      />
      <Sparkles className="w-3.5 h-3.5 text-violet-400 relative z-10" />
      <span className="text-xs font-semibold text-violet-300 relative z-10">
        {children}
      </span>
    </motion.div>
  );
}

function ConnectingLine() {
  return (
    <svg
      className="absolute hidden lg:block pointer-events-none"
      style={{
        left: "calc(60% - 1px)",
        top: "0",
        bottom: "0",
        width: "40px",
      }}
      viewBox="0 0 40 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <motion.path
        d="M 0 40 Q 20 40, 20 60 L 20 140 Q 20 160, 40 160"
        stroke="url(#lineGrad)"
        strokeWidth="1.5"
        strokeDasharray="4 4"
        fill="none"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 0.4 }}
        transition={{ duration: 1.2, delay: 0.8, ease: "easeInOut" }}
      />
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FloatingOrb({
  className,
  size = 200,
  color = "rgba(124, 58, 237, 0.12)",
}: {
  className?: string;
  size?: number;
  color?: string;
}) {
  return (
    <motion.div
      className={cn("absolute rounded-full pointer-events-none", className)}
      style={{ width: size, height: size, background: `radial-gradient(circle, ${color}, transparent 70%)` }}
      animate={{ y: [0, -20, 0], x: [0, 10, 0], scale: [1, 1.08, 1] }}
      transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}

export function CodeDemoSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section ref={sectionRef} className="relative py-8 sm:py-12 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 relative">
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <ShimmerBadge>Live Demo</ShimmerBadge>
        </div>

        <div className="relative grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          <motion.div
            className="lg:col-span-3 relative z-10"
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <CodeWindow />
          </motion.div>

          <motion.div
            className="lg:col-span-2 relative z-0 lg:-translate-y-4 lg:translate-x-[-12px]"
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
          >
            <TerminalPanel />
          </motion.div>

          <ConnectingLine />
        </div>

        <motion.div
          className="text-center mt-4 sm:mt-6"
          initial={{ opacity: 0, y: 10 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <p className="text-sm text-white/50">
            AI-powered feedback on every solution — just like a real interview.
          </p>
        </motion.div>
      </div>

      <FloatingOrb className="-top-20 -left-20" size={250} color="rgba(124, 58, 237, 0.10)" />
      <FloatingOrb className="-bottom-32 -right-20" size={300} color="rgba(6, 182, 212, 0.08)" />
      <FloatingOrb className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" size={400} color="rgba(124, 58, 237, 0.04)" />
    </section>
  );
}
