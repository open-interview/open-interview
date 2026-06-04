import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Mic,
  Brain,
  Target,
  Code2,
  Trophy,
  Zap,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { InteractiveFeatureCard } from "@/components/home/InteractiveFeatureCard";

const FEATURES = [
  {
    icon: <Mic className="w-5 h-5" />,
    title: "AI Voice Interviews",
    description:
      "Practice speaking your answers out loud with AI that provides real-time feedback on clarity, completeness, and confidence.",
    gradient: "from-violet-600 to-indigo-600",
    shadow: "shadow-violet-500/20",
    color: "violet",
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: "Spaced Repetition (SRS)",
    description:
      "Our SRS algorithm ensures you review concepts at optimal intervals for maximum long-term retention with minimal effort.",
    gradient: "from-cyan-600 to-blue-600",
    shadow: "shadow-cyan-500/20",
    color: "cyan",
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Personalized Learning Paths",
    description:
      "Custom learning paths tailored to your target role, experience level, and interview timeline with adaptive difficulty.",
    gradient: "from-emerald-600 to-teal-600",
    shadow: "shadow-emerald-500/20",
    color: "emerald",
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    title: "Interactive Code Challenges",
    description:
      "Real-time coding environment with AI-powered hints, test case validation, and instant feedback in Python and JavaScript.",
    gradient: "from-amber-600 to-orange-600",
    shadow: "shadow-amber-500/20",
    color: "amber",
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    title: "Gamified Progress System",
    description:
      "Earn XP, unlock achievements, maintain streaks, and compete on leaderboards. Learning that feels like leveling up.",
    gradient: "from-pink-600 to-rose-600",
    shadow: "shadow-pink-500/20",
    color: "pink",
  },
  {
    icon: <Zap className="w-5 h-5" />,
    title: "30,000+ Expert Questions",
    description:
      "Comprehensive question bank across 93 topics curated by senior FAANG engineers with detailed explanations.",
    gradient: "from-purple-600 to-violet-600",
    shadow: "shadow-purple-500/20",
    color: "purple",
  },
] as const;

const MOCKUP_COLORS: Record<
  string,
  { bg: string; circle: string; dot: string }
> = {
  violet: {
    bg: "radial-gradient(ellipse at 50% 50%, rgba(124,58,237,0.25) 0%, rgba(99,102,241,0.10) 40%, transparent 70%)",
    circle: "from-violet-600 to-indigo-600",
    dot: "bg-violet-400/25",
  },
  cyan: {
    bg: "radial-gradient(ellipse at 50% 50%, rgba(8,145,178,0.25) 0%, rgba(59,130,246,0.10) 40%, transparent 70%)",
    circle: "from-cyan-600 to-blue-600",
    dot: "bg-cyan-400/25",
  },
  emerald: {
    bg: "radial-gradient(ellipse at 50% 50%, rgba(5,150,105,0.25) 0%, rgba(13,148,136,0.10) 40%, transparent 70%)",
    circle: "from-emerald-600 to-teal-600",
    dot: "bg-emerald-400/25",
  },
  amber: {
    bg: "radial-gradient(ellipse at 50% 50%, rgba(217,119,6,0.25) 0%, rgba(234,88,12,0.10) 40%, transparent 70%)",
    circle: "from-amber-600 to-orange-600",
    dot: "bg-amber-400/25",
  },
  pink: {
    bg: "radial-gradient(ellipse at 50% 50%, rgba(219,39,119,0.25) 0%, rgba(225,29,72,0.10) 40%, transparent 70%)",
    circle: "from-pink-600 to-rose-600",
    dot: "bg-pink-400/25",
  },
  purple: {
    bg: "radial-gradient(ellipse at 50% 50%, rgba(147,51,234,0.25) 0%, rgba(124,58,237,0.10) 40%, transparent 70%)",
    circle: "from-purple-600 to-violet-600",
    dot: "bg-purple-400/25",
  },
};

function FeatureMockup({ feature }: { feature: (typeof FEATURES)[number] }) {
  const colors = MOCKUP_COLORS[feature.color];
  const dots = [
    { top: "15%", left: "12%" },
    { top: "18%", right: "20%" },
    { bottom: "22%", left: "18%" },
    { bottom: "16%", right: "14%" },
    { top: "45%", right: "8%" },
    { bottom: "8%", left: "45%" },
    { top: "70%", left: "8%" },
    { top: "10%", left: "55%" },
  ];

  return (
    <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-[#0a0e1a] border border-white/[0.06]">
      <div
        className="absolute inset-0"
        style={{ background: colors.bg }}
      />

      <div className="absolute inset-0 dot-grid opacity-30" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative">
          <div
            className="absolute inset-0 rounded-full blur-3xl opacity-40"
            style={{
              background: colors.bg,
              transform: "scale(2)",
            }}
          />
          <div
            className={cn(
              "relative w-20 h-20 rounded-full bg-gradient-to-br flex items-center justify-center shadow-2xl",
              colors.circle,
            )}
          >
            {feature.icon}
          </div>
        </div>
      </div>

      {dots.map((pos, i) => (
        <div
          key={i}
          className={cn(
            "absolute w-1.5 h-1.5 rounded-full transition-all duration-500",
            colors.dot,
          )}
          style={{
            top: pos.top,
            left: pos.left,
            right: pos.right,
          }}
        />
      ))}

      <div className="absolute bottom-3 left-3 right-3 flex gap-1.5">
        {[1, 2, 3].map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-1 rounded-full flex-1 opacity-20",
              i === 0 ? "w-8" : i === 1 ? "w-12" : "w-6",
            )}
            style={{ background: `var(--brand-${feature.color}-400, #a78bfa)` }}
          />
        ))}
      </div>
    </div>
  );
}

function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border border-white/[0.08] bg-white/[0.03]"
    >
      <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-400" />
      <span className="text-[10px] sm:text-xs font-medium text-white/60">
        {children}
      </span>
    </motion.div>
  );
}

export function FeatureShowcase() {
  const [, setLocation] = useLocation();
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-80px" });

  return (
    <section
      ref={sectionRef}
      id="features"
      className="relative py-10 sm:py-16 overflow-hidden"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <div className="flex justify-center mb-3">
            <SectionBadge>Why Open Interview</SectionBadge>
          </div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl sm:text-3xl font-bold text-white mb-2 text-balance"
          >
            Everything you need to{" "}
            <span className="gradient-text">ace the interview</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-sm sm:text-base text-white/60 max-w-xl mx-auto text-balance"
          >
            A complete interview preparation platform built by engineers, for
            engineers.
          </motion.p>
        </div>

        {/* Connection line */}
        <div className="relative">
          <div className="absolute left-0 top-0 bottom-0 hidden lg:block">
            <div className="relative h-full w-px bg-gradient-to-b from-violet-500/40 via-cyan-500/20 to-transparent ml-6">
              {FEATURES.map((_, i) => (
                <div
                  key={i}
                  className="absolute w-2 h-2 -left-[3.5px] rounded-full bg-violet-500/40"
                  style={{
                    top: `${(i / (FEATURES.length - 1)) * 100}%`,
                    transform: "translateY(-50%)",
                  }}
                />
              ))}
            </div>
          </div>

          <div className="space-y-8 sm:space-y-12 lg:pl-16">
            {FEATURES.map((feature, i) => {
              const isReversed = i % 2 === 1;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{
                    duration: 0.6,
                    delay: i * 0.08,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className={cn(
                    "flex flex-col gap-6 sm:gap-8 items-center",
                    isReversed ? "lg:flex-row-reverse" : "lg:flex-row",
                  )}
                >
                  {/* Content side */}
                  <div className="flex-1 w-full group">
                    <div className="relative">
                      <div
                        className={cn(
                          "absolute -inset-4 rounded-2xl opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none",
                          feature.color === "violet" &&
                            "bg-gradient-to-r from-violet-500/5 to-transparent",
                          feature.color === "cyan" &&
                            "bg-gradient-to-r from-cyan-500/5 to-transparent",
                          feature.color === "emerald" &&
                            "bg-gradient-to-r from-emerald-500/5 to-transparent",
                          feature.color === "amber" &&
                            "bg-gradient-to-r from-amber-500/5 to-transparent",
                          feature.color === "pink" &&
                            "bg-gradient-to-r from-pink-500/5 to-transparent",
                          feature.color === "purple" &&
                            "bg-gradient-to-r from-purple-500/5 to-transparent",
                          isReversed && "lg:bg-gradient-to-l",
                        )}
                      />
                      <div className="relative">
                        <InteractiveFeatureCard
                          icon={feature.icon}
                          title={feature.title}
                          description={feature.description}
                          gradient={feature.gradient}
                          shadow={feature.shadow}
                          delay={i}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visual side */}
                  <div className="flex-1 w-full">
                    <FeatureMockup feature={feature} />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center mt-10 sm:mt-14"
        >
          <button
            onClick={() => setLocation("/learning-paths")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-semibold text-sm text-white transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer"
            style={{
              background:
                "linear-gradient(135deg, #A78BFA 0%, #7C3AED 50%, #06b6d4 100%)",
              boxShadow:
                "0 4px 20px rgba(124,58,237,0.30), 0 2px 8px rgba(124,58,237,0.20)",
            }}
          >
            Start Your Journey <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
