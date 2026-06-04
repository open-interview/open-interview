/**
 * Open Interview Home — OLED dark, green accent, clean bento layout
 */

import { useState, useEffect, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useLocation } from "wouter";
import {
  Zap, Code2, Mic, Target, Trophy, Layers,
  ArrowRight, Brain, Shield, Github, ChevronRight,
  Server, Terminal, Cloud,
} from "lucide-react";
import { SEOHead } from "../components/SEOHead";

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};
const stagger = { show: { transition: { staggerChildren: 0.05 } } };
const scaleIn = {
  hidden: { opacity: 0, scale: 0.94 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.35, ease: "easeOut" as const } },
};

function OnView({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const r = useRef<HTMLDivElement>(null);
  const v = useInView(r, { once: true, margin: "-40px" });
  return (
    <motion.div ref={r} initial="hidden" animate={v ? "show" : "hidden"} variants={stagger} className={className}>
      {children}
    </motion.div>
  );
}

// ─── Backdrop ────────────────────────────────────────────────────────────────
function Backdrop() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <div className="absolute inset-0 opacity-[0.012]" style={{ backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`, backgroundSize: "44px 44px" }} />
      <motion.div className="absolute -top-32 -left-32 w-[400px] h-[400px] rounded-full bg-emerald-500/10"
        animate={{ x: [0, 20, -10, 0], y: [0, -12, 8, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "blur(100px)" }}
      />
      <motion.div className="absolute top-1/3 -right-20 w-[300px] h-[300px] rounded-full bg-blue-500/8"
        animate={{ x: [0, -15, 10, 0], y: [0, 12, -8, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        style={{ filter: "blur(80px)" }}
      />
    </div>
  );
}

function Glass({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative p-[1px] rounded-xl overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-white/[0.01] backdrop-blur-xl rounded-xl border border-white/[0.06]" />
      <div className="relative">{children}</div>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────
function Nav() {
  const [, setLoc] = useLocation();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  return (
    <motion.nav
      initial={{ y: -80 }} animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-[#0a0e1a]/70 backdrop-blur-2xl border-b border-white/[0.04]" : "bg-transparent"}`}
    >
      <div className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between">
        <button onClick={() => setLoc("/")} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:shadow-emerald-400/35 transition-shadow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Open<span className="text-emerald-400">Interview</span>
          </span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          {["Channels", "Articles", "About"].map(l => (
            <button key={l} onClick={() => setLoc(`/${l.toLowerCase()}`)}
              className="text-sm text-white/50 hover:text-white transition-colors"
            >
              {l}
            </button>
          ))}
        </div>

        <button onClick={() => setLoc("/channels")}
          className="group relative px-4 py-2 rounded-lg text-white font-medium text-sm overflow-hidden"
        >
          <div className="absolute inset-0 bg-emerald-600 hover:bg-emerald-500 transition-colors" />
          <span className="relative flex items-center gap-1.5">
            Get Started <ArrowRight className="w-3 h-3" />
          </span>
        </button>
      </div>
    </motion.nav>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────
function Hero() {
  const [, setLoc] = useLocation();
  return (
    <section className="relative min-h-[75vh] flex items-center justify-center overflow-hidden pt-14">
      <Backdrop />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-emerald-500/4" style={{ filter: "blur(80px)" }} />

      <div className="relative z-10 max-w-2xl mx-auto px-4 text-center">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-medium text-emerald-300/80">30,000+ questions · 93 topics</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.05] mt-4 mb-3"
        >
          <span className="text-white">Ace your next</span>
          <br />
          <span className="text-emerald-400">tech interview</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.32 }}
          className="text-sm sm:text-base text-white/40 max-w-lg mx-auto mb-6 leading-relaxed"
        >
          Practice system design, algorithms, and behavioral interviews with AI-powered feedback. Built by engineers, for engineers.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.42 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8"
        >
          <button onClick={() => setLoc("/channels")}
            className="group relative px-7 py-3 rounded-xl text-white font-semibold text-sm overflow-hidden"
          >
            <div className="absolute inset-0 bg-emerald-600 group-hover:bg-emerald-500 transition-colors" />
            <div className="absolute inset-0 bg-emerald-400 opacity-0 group-hover:opacity-25 blur-xl transition-opacity" />
            <span className="relative flex items-center gap-2">
              Start Practicing Free <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </button>
          <button onClick={() => setLoc("/blog")}
            className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm border border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/[0.15] transition-all text-white/70 hover:text-white"
          >
            Read Articles <ChevronRight className="w-3 h-3" />
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
        >
          <Glass>
            <div className="flex items-center justify-center gap-6 sm:gap-10 px-5 py-2.5">
              {[
                { label: "Questions", value: "30,533+" },
                { label: "Topics", value: "93" },
                { label: "Articles", value: "126+" },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-emerald-400">{s.value}</div>
                  <div className="text-[9px] font-medium text-white/40 uppercase tracking-widest">{s.label}</div>
                </div>
              ))}
            </div>
          </Glass>
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
    </section>
  );
}

// ─── Unified Feature Grid ─────────────────────────────────────────────────────
const CARDS = [
  { icon: <Mic className="w-4 h-4" />, title: "AI Voice Interviews", desc: "Real-time feedback on clarity and confidence." },
  { icon: <Brain className="w-4 h-4" />, title: "Spaced Repetition", desc: "SRS optimizes review intervals for retention." },
  { icon: <Code2 className="w-4 h-4" />, title: "Code Challenges", desc: "Interactive problems with AI hints across Python, JS, and more." },
  { icon: <Server className="w-4 h-4" />, title: "System Design", desc: "Whiteboard practice with expert solutions." },
  { icon: <Terminal className="w-4 h-4" />, title: "Algorithms & DS", desc: "500+ problems with complexity analysis." },
  { icon: <Target className="w-4 h-4" />, title: "Personalized Paths", desc: "Tailored learning based on your target role." },
  { icon: <Cloud className="w-4 h-4" />, title: "Behavioral Prep", desc: "STAR coaching with AI response scoring." },
  { icon: <Trophy className="w-4 h-4" />, title: "Gamified Progress", desc: "XP, achievements, and learning streaks." },
  { icon: <Layers className="w-4 h-4" />, title: "93 Deep Topics", desc: "Curated by FAANG engineers across every domain." },
];

function FeatureGrid() {
  return (
    <OnView>
      <div className="max-w-5xl mx-auto px-4">
        <motion.div variants={fadeUp} className="text-center mb-5">
          <p className="text-[11px] font-medium text-emerald-400/70 uppercase tracking-widest mb-1">Everything you need</p>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Built to <span className="text-emerald-400">ace the interview</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {CARDS.map(c => (
            <motion.div key={c.title} variants={scaleIn} className="group">
              <div className="relative p-[1px] rounded-xl overflow-hidden h-full">
                <div className="absolute inset-0 rounded-xl bg-[#111827] border border-white/[0.06] group-hover:border-emerald-500/20 transition-colors duration-500" />
                <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.06),transparent_60%)] transition-opacity duration-500" />
                <div className="relative h-full p-3 sm:p-3.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition-transform duration-300">
                    {c.icon}
                  </div>
                  <h3 className="text-xs font-semibold text-white mb-0.5 leading-snug">{c.title}</h3>
                  <p className="text-[10px] text-white/50 leading-relaxed">{c.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </OnView>
  );
}

// ─── CTA Strip ───────────────────────────────────────────────────────────────
function CTAStrip() {
  const [, setLoc] = useLocation();
  return (
    <div className="border-t border-white/[0.04]">
      <div className="max-w-5xl mx-auto px-4 py-5">
        <Glass>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
              {[
                { icon: <Github className="w-3.5 h-3.5" />, label: "Open Source" },
                { icon: <Zap className="w-3.5 h-3.5" />, label: "Free Forever" },
                { icon: <Shield className="w-3.5 h-3.5" />, label: "Privacy First" },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-1.5 text-white/40">
                  <span className="text-emerald-400/60">{s.icon}</span>
                  <span className="text-[11px] font-medium">{s.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setLoc("/channels")}
              className="group relative px-4 py-2 rounded-lg text-white font-semibold text-xs overflow-hidden shrink-0"
            >
              <div className="absolute inset-0 bg-emerald-600 hover:bg-emerald-500 transition-colors" />
              <span className="relative flex items-center gap-1.5">
                Start Practicing <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </button>
          </div>
        </Glass>
      </div>
    </div>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function Footer() {
  const [, setLoc] = useLocation();
  return (
    <footer className="pb-6">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-white/[0.04]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center">
              <Zap className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="text-xs font-bold text-white/60">Open<span className="text-emerald-400">Interview</span></span>
            <span className="text-[9px] text-white/20 mx-1">·</span>
            <span className="text-[9px] text-white/20">&copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex items-center gap-4">
            {[
              { label: "Channels", path: "/channels" },
              { label: "Blog", path: "/blog" },
              { label: "About", path: "/about" },
              { label: "GitHub", path: "https://github.com/open-interview", ext: true },
            ].map(l => (
              <button key={l.label}
                onClick={() => l.ext ? window.open(l.path, "_blank") : setLoc(l.path)}
                className="text-[10px] text-white/40 hover:text-white/60 transition-colors"
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function HomeFacelift() {
  return (
    <>
      <SEOHead
        title="Open Interview — Master Engineering Interviews with AI"
        description="Practice system design, algorithms, and behavioral interviews with AI-powered feedback. 30,000+ questions across 93 learning channels."
        canonical="https://open-interview.github.io/"
      />
      <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden flex flex-col">
        <Nav />
        <Hero />
        <div className="-mt-12 relative z-10 pb-4">
          <FeatureGrid />
        </div>
        <div className="mt-auto">
          <CTAStrip />
          <Footer />
        </div>
      </div>
    </>
  );
}
