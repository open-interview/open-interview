import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";

const floatingOrbs = [
  { size: 80, x: "10%", y: "15%", color: "bg-violet-500/15", duration: 8, delay: 0 },
  { size: 60, x: "85%", y: "10%", color: "bg-cyan-500/15", duration: 10, delay: 1 },
  { size: 100, x: "75%", y: "70%", color: "bg-indigo-500/10", duration: 12, delay: 2 },
  { size: 50, x: "20%", y: "75%", color: "bg-violet-400/10", duration: 7, delay: 0.5 },
];

export function AnimatedCTASection() {
  const [, setLocation] = useLocation();

  return (
    <section className="relative py-12 sm:py-20">
      <div className="max-w-4xl mx-auto px-3 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative p-[2px] rounded-2xl sm:rounded-3xl overflow-hidden gradient-border-animated"
        >
          <div className="relative p-8 sm:p-12 lg:p-16 rounded-2xl sm:rounded-3xl bg-[#0a0e1a] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-cyan-500/5" />

            <div
              className="absolute inset-0 opacity-[0.03]"
              style={{
                backgroundImage:
                  "radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)",
                backgroundSize: "24px 24px",
              }}
            />

            {floatingOrbs.map((orb, i) => (
              <motion.div
                key={i}
                className={`absolute ${orb.color} rounded-full blur-3xl`}
                style={{
                  width: orb.size,
                  height: orb.size,
                  left: orb.x,
                  top: orb.y,
                }}
                animate={{
                  y: [0, -20, 0],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: orb.duration,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: orb.delay,
                }}
              />
            ))}

            <div className="relative z-10 text-center">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 text-balance">
                Ready to ace your <br />
                <span className="gradient-text-animated">next interview?</span>
              </h2>

              <p className="text-sm sm:text-lg text-white/60 max-w-2xl mx-auto mb-8 sm:mb-10">
                Join thousands of engineers who use Open Interview to prepare for
                system design, algorithms, and behavioral interviews at top tech
                companies.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: "0 0 40px rgba(124,58,237,0.35), 0 0 80px rgba(6,182,212,0.15)" }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLocation("/training")}
                  className="btn-primary text-base px-8 py-3.5 group"
                >
                  Start Practicing Free
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setLocation("/channels")}
                  className="btn-secondary text-base px-8 py-3.5"
                >
                  Browse Channels
                </motion.button>
              </div>

              <p className="mt-6 text-xs sm:text-sm text-white/40">
                No credit card required &bull; Free forever &bull; Open source
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
