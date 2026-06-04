import React from 'react';
import { motion } from 'framer-motion';
import { Brain, BookOpen, FileText, Users, Star, Github, Sparkles, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricItem {
  value: string;
  label: string;
  icon: React.ReactNode;
  suffix?: string;
}

interface EnterpriseTrustBarProps {
  metrics?: MetricItem[];
  className?: string;
}

const defaultMetrics: MetricItem[] = [
  { value: "30,533+", label: "Practice Questions", icon: <Brain className="w-4 h-4" /> },
  { value: "93", label: "Learning Channels", icon: <BookOpen className="w-4 h-4" /> },
  { value: "126+", label: "In-depth Articles", icon: <FileText className="w-4 h-4" /> },
  { value: "50K+", label: "Engineers Helped", icon: <Users className="w-4 h-4" /> },
  { value: "4.8/5", label: "User Rating", icon: <Star className="w-4 h-4" /> },
];

const metricColors = [
  { circle: "from-violet-500/20 to-violet-600/10", text: "gradient-text", border: "border-violet-500/20" },
  { circle: "from-cyan-500/20 to-cyan-600/10", text: "text-cyan-400", border: "border-cyan-500/20" },
  { circle: "from-emerald-500/20 to-emerald-600/10", text: "text-emerald-400", border: "border-emerald-500/20" },
  { circle: "from-amber-500/20 to-amber-600/10", text: "text-amber-400", border: "border-amber-500/20" },
  { circle: "from-pink-500/20 to-pink-600/10", text: "text-pink-400", border: "border-pink-500/20" },
];

const companies = [
  "Google", "Meta", "Amazon", "Stripe", "Netflix", "Microsoft", "Apple", "Spotify",
];

const trustSignals = [
  { icon: <Github className="w-4 h-4" />, label: "Open Source", accent: "text-emerald-400" },
  { icon: <Sparkles className="w-4 h-4" />, label: "Free Forever", accent: "text-cyan-400" },
  { icon: <Heart className="w-4 h-4" />, label: "Community Driven", accent: "text-pink-400" },
];

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const easeOut = [0.25, 0.1, 0.25, 1] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: easeOut },
  },
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { duration: 0.6 },
  },
};

function CounterValue({ value, suffix }: { value: string; suffix?: string }) {
  const numeric = parseInt(value.replace(/[^0-9]/g, ''), 10);
  const isNumeric = !isNaN(numeric);
  const ref = React.useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = React.useState(isNumeric ? '0' : value);

  React.useEffect(() => {
    if (!isNumeric) return;
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const duration = 1500;
            const start = performance.now();
            const suffixMatch = value.match(/([+,.kK]?)$/);
            const rawSuffix = suffixMatch ? suffixMatch[1] : '';

            const animate = (now: number) => {
              const elapsed = now - start;
              const progress = Math.min(elapsed / duration, 1);
              const eased = 1 - Math.pow(1 - progress, 3);
              const current = Math.floor(eased * numeric);
              setDisplay(`${current.toLocaleString()}${rawSuffix}`);
              if (progress < 1) {
                requestAnimationFrame(animate);
              }
            };
            requestAnimationFrame(animate);
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [numeric, isNumeric, value]);

  return (
    <span ref={ref}>
      {display}{suffix || ''}
    </span>
  );
}

export function EnterpriseTrustBar({ metrics, className }: EnterpriseTrustBarProps) {
  const items = metrics || defaultMetrics;

  return (
    <section className={cn("relative py-12 sm:py-20 overflow-hidden", className)}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent" />

      <motion.div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          background: "repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(139, 92, 246, 0.3) 40px, rgba(139, 92, 246, 0.3) 41px)",
        }}
        animate={{ backgroundPosition: ["0px 0px", "80px 0px"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      <div className="relative max-w-7xl mx-auto px-3 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-xs font-medium text-white/60 uppercase tracking-wider"
          >
            Trusted by the engineering community
          </motion.span>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-50px" }}
          className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-6 mb-12 sm:mb-16"
        >
          {items.map((metric, i) => {
            const colors = metricColors[i % metricColors.length];
            return (
              <motion.div
                key={metric.label}
                variants={fadeUp}
                whileHover={{ scale: 1.05, y: -4 }}
                className="relative group"
              >
                <div className={cn(
                  "relative flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl",
                  "bg-white/[0.02] border backdrop-blur-sm",
                  "hover:bg-white/[0.04] transition-colors duration-300",
                  colors.border
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br",
                    "shadow-lg shadow-black/20",
                    colors.circle
                  )}>
                    <span className={colors.text}>
                      {metric.icon}
                    </span>
                  </div>

                  <div className="text-center">
                    <div className={cn(
                      "text-2xl sm:text-3xl font-bold leading-none mb-1",
                      colors.text
                    )}>
                      <CounterValue value={metric.value} suffix={metric.suffix} />
                    </div>
                    <div className="text-[11px] sm:text-xs text-white/40 font-medium leading-tight">
                      {metric.label}
                    </div>
                  </div>

                  {i < items.length - 1 && (
                    <div className="hidden md:block absolute right-0 top-1/2 -translate-y-1/2 w-px h-12 bg-gradient-to-b from-transparent via-white/10 to-transparent" />
                  )}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        <div className="text-center mb-8 sm:mb-12">
          <motion.span
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs text-white/40 uppercase tracking-wider block mb-4 sm:mb-5"
          >
            Trusted by engineers at
          </motion.span>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-30px" }}
            className="flex flex-wrap justify-center gap-2 sm:gap-3"
          >
            {companies.map((company) => (
              <motion.span
                key={company}
                variants={fadeUp}
                whileHover={{ scale: 1.06, y: -2 }}
                className={cn(
                  "inline-flex items-center px-3.5 py-1.5 rounded-full",
                  "text-xs sm:text-sm font-medium text-white/50",
                  "bg-white/[0.03] border border-white/10",
                  "hover:bg-white/[0.06] hover:text-white/70 hover:border-white/20",
                  "transition-all duration-200 select-none"
                )}
              >
                {company}
              </motion.span>
            ))}
          </motion.div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-30px" }}
          className="flex flex-wrap justify-center gap-4 sm:gap-8"
        >
          {trustSignals.map((signal) => (
            <motion.div
              key={signal.label}
              variants={fadeIn}
              whileHover={{ scale: 1.05, y: -2 }}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all duration-200"
            >
              <span className={signal.accent}>{signal.icon}</span>
              <span className="text-xs sm:text-sm text-white/60 font-medium">{signal.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
