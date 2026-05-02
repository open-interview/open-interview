/**
 * DevInsights Home Facelift — Premium Landing Page
 * Inspired by Linear.app / Vercel.com aesthetic
 * Features: Aurora hero, scroll animations, feature highlights, newsletter signup
 */

import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useInView, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Zap,
  BookOpen,
  Code2,
  Mic,
  Target,
  Trophy,
  Sparkles,
  ArrowRight,
  ChevronRight,
  TrendingUp,
  Brain,
  Shield,
  Layers,
  Clock,
  Users,
  Star,
  CheckCircle2,
  Mail,
  Github,
  Play,
  ArrowUpRight,
} from "lucide-react";
import { SEOHead } from "../components/SEOHead";

// ─── Animation variants ───────────────────────────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const stagger = {
  show: { transition: { staggerChildren: 0.1 } },
};

const scaleFade = {
  hidden: { opacity: 0, scale: 0.95 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
};

// ─── Scroll-aware section wrapper ─────────────────────────────────────────────
function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={inView ? "show" : "hidden"}
      variants={stagger}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// ─── Animated number counter ──────────────────────────────────────────────────
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const step = Math.ceil(value / 40);
    const interval = setInterval(() => {
      start += step;
      if (start >= value) {
        setDisplay(value);
        clearInterval(interval);
      } else {
        setDisplay(start);
      }
    }, 25);
    return () => clearInterval(interval);
  }, [inView, value]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

// ─── Floating orb (aurora decoration) ─────────────────────────────────────────
function FloatingOrb({
  className,
  color,
  size,
  duration,
}: {
  className?: string;
  color: string;
  size: number;
  duration: number;
}) {
  return (
    <motion.div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: color,
        filter: `blur(${size * 0.5}px)`,
      }}
      animate={{
        x: [0, 40, -20, 0],
        y: [0, -30, 20, 0],
        scale: [1, 1.15, 0.95, 1],
        opacity: [0.3, 0.5, 0.3],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

// ─── Aurora Background ────────────────────────────────────────────────────────
function AuroraBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />
      {/* Floating orbs */}
      <FloatingOrb
        className="absolute -top-32 -left-32"
        color="radial-gradient(circle, rgba(124,58,237,0.8), transparent)"
        size={500}
        duration={12}
      />
      <FloatingOrb
        className="absolute top-1/4 right-0"
        color="radial-gradient(circle, rgba(6,182,212,0.6), transparent)"
        size={400}
        duration={15}
      />
      <FloatingOrb
        className="absolute bottom-0 left-1/3"
        color="radial-gradient(circle, rgba(99,102,241,0.5), transparent)"
        size={350}
        duration={10}
      />
      <FloatingOrb
        className="absolute top-2/3 -right-20"
        color="radial-gradient(circle, rgba(139,92,246,0.4), transparent)"
        size={300}
        duration={18}
      />
    </div>
  );
}

// ─── Navbar ───────────────────────────────────────────────────────────────────
function LandingNavbar() {
  const [, setLocation] = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-[#0a0e1a]/80 backdrop-blur-xl border-b border-white/[0.06]"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2.5 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold text-white tracking-tight">
            Dev<span className="gradient-text">Insights</span>
          </span>
        </button>

        <div className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-white/60 hover:text-white transition-colors">
            Features
          </a>
          <a href="#topics" className="text-sm text-white/60 hover:text-white transition-colors">
            Topics
          </a>
          <a href="#articles" className="text-sm text-white/60 hover:text-white transition-colors">
            Articles
          </a>
          <a href="#community" className="text-sm text-white/60 hover:text-white transition-colors">
            Community
          </a>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation("/blog")}
            className="hidden sm:flex text-sm text-white/60 hover:text-white transition-colors px-3 py-2"
          >
            Blog
          </button>
          <button
            onClick={() => setLocation("/learning-paths")}
            className="text-sm font-medium text-white bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] px-4 py-2 rounded-lg transition-all"
          >
            Get Started
          </button>
        </div>
      </div>
    </motion.nav>
  );
}

// ─── Hero Section ─────────────────────────────────────────────────────────────
function HeroSection() {
  const [, setLocation] = useLocation();
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 150]);
  const y2 = useTransform(scrollY, [0, 500], [0, -100]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  return (
    <motion.section
      style={{ opacity, y: y1 }}
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16"
    >
      <AuroraBackground />

      <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] backdrop-blur-sm mb-8"
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-xs font-medium text-white/70">
            Trusted by 12,000+ engineers worldwide
          </span>
          <ChevronRight className="w-3 h-3 text-white/30" />
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
        >
          Master engineering
          <br />
          <span className="gradient-text">interviews with AI</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-lg sm:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Practice system design, algorithms, and behavioral interviews with AI-powered
          feedback. Join thousands of engineers who landed their dream roles.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16"
        >
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: "0 0 40px rgba(124,58,237,0.4)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/learning-paths")}
            className="group relative px-8 py-3.5 rounded-xl text-white font-semibold text-base overflow-hidden transition-all"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500" />
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600 via-indigo-500 to-cyan-500 opacity-0 group-hover:opacity-100 blur-xl transition-opacity" />
            <span className="relative flex items-center gap-2">
              Start Practicing Free
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLocation("/blog")}
            className="group flex items-center gap-2 px-6 py-3.5 rounded-xl text-white/80 font-medium text-base border border-white/[0.1] hover:border-white/[0.2] hover:bg-white/[0.05] transition-all"
          >
            <Play className="w-4 h-4" />
            Read Articles
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          style={{ y: y2 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-6 max-w-3xl mx-auto"
        >
          {[
            { label: "Practice Questions", value: 1500, suffix: "+" },
            { label: "Engineers Helped", value: 12, suffix: "K+" },
            { label: "Topics Covered", value: 30, suffix: "+" },
            { label: "Success Rate", value: 85, suffix: "%" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl sm:text-3xl font-bold text-white mb-1">
                <AnimatedNumber value={stat.value} suffix={stat.suffix} />
              </div>
              <div className="text-xs text-white/40 font-medium uppercase tracking-wider">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#0a0e1a] to-transparent" />
    </motion.section>
  );
}

// ─── Featured Articles Section ────────────────────────────────────────────────
const FEATURED_ARTICLES = [
  {
    title: "System Design: Building a URL Shortener at Scale",
    description:
      "Learn how to design and implement a URL shortening service that handles millions of requests per day with low latency.",
    category: "System Design",
    readTime: "8 min",
    icon: <Layers className="w-5 h-5" />,
    gradient: "from-violet-500/20 to-indigo-500/20",
    borderColor: "border-violet-500/20",
    href: "/blog/system-design-url-shortener",
  },
  {
    title: "React Reconciliation: How the Virtual DOM Really Works",
    description:
      "Deep dive into React's diffing algorithm and understand why your components re-render the way they do.",
    category: "Frontend",
    readTime: "6 min",
    icon: <Code2 className="w-5 h-5" />,
    gradient: "from-cyan-500/20 to-blue-500/20",
    borderColor: "border-cyan-500/20",
    href: "/blog/react-reconciliation",
  },
  {
    title: "The CAP Theorem Explained with Real-World Examples",
    description:
      "Understanding consistency, availability, and partition tolerance through practical distributed systems scenarios.",
    category: "Database",
    readTime: "10 min",
    icon: <Brain className="w-5 h-5" />,
    gradient: "from-amber-500/20 to-orange-500/20",
    borderColor: "border-amber-500/20",
    href: "/blog/cap-theorem-explained",
  },
];

function FeaturedArticles() {
  const [, setLocation] = useLocation();

  return (
    <section id="articles" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] mb-4">
              <BookOpen className="w-3.5 h-3.5 text-violet-400" />
              <span className="text-xs font-medium text-white/60">Featured Articles</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Learn from the <span className="gradient-text">best resources</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/40 max-w-xl mx-auto">
              Curated engineering articles written by senior engineers from top tech companies.
            </motion.p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURED_ARTICLES.map((article, i) => (
            <motion.div
              key={article.title}
              variants={scaleFade}
              whileHover={{ y: -4 }}
              className="group relative p-[1px] rounded-2xl overflow-hidden"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${article.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />
              <div className="relative h-full p-6 rounded-2xl bg-[#0f1629] border border-white/[0.06] group-hover:border-white/[0.12] transition-colors">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${article.gradient} flex items-center justify-center`}>
                    {article.icon}
                  </div>
                  <span className="text-xs font-medium text-white/40">{article.category}</span>
                  <span className="text-xs text-white/20">·</span>
                  <span className="text-xs text-white/30 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {article.readTime}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors leading-snug">
                  {article.title}
                </h3>
                <p className="text-sm text-white/40 leading-relaxed mb-4 line-clamp-3">
                  {article.description}
                </p>

                <button
                  onClick={() => setLocation(article.href)}
                  className="flex items-center gap-1.5 text-sm font-medium text-violet-400 group-hover:text-violet-300 transition-colors"
                >
                  Read article
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div variants={fadeUp} className="text-center mt-10">
          <button
            onClick={() => setLocation("/blog")}
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white transition-colors group"
          >
            View all articles
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Trending Topics Section ──────────────────────────────────────────────────
const TRENDING_TOPICS = [
  { name: "System Design", count: 234, icon: "🏗️", color: "from-violet-500/20 to-violet-600/10", border: "border-violet-500/20" },
  { name: "React", count: 189, icon: "⚛️", color: "from-cyan-500/20 to-cyan-600/10", border: "border-cyan-500/20" },
  { name: "Algorithms", count: 312, icon: "🧮", color: "from-emerald-500/20 to-emerald-600/10", border: "border-emerald-500/20" },
  { name: "Docker", count: 98, icon: "🐳", color: "from-blue-500/20 to-blue-600/10", border: "border-blue-500/20" },
  { name: "Kubernetes", count: 76, icon: "☸️", color: "from-indigo-500/20 to-indigo-600/10", border: "border-indigo-500/20" },
  { name: "Node.js", count: 145, icon: "🟢", color: "from-green-500/20 to-green-600/10", border: "border-green-500/20" },
  { name: "PostgreSQL", count: 87, icon: "🐘", color: "from-sky-500/20 to-sky-600/10", border: "border-sky-500/20" },
  { name: "Redis", count: 54, icon: "🔴", color: "from-red-500/20 to-red-600/10", border: "border-red-500/20" },
  { name: "AWS", count: 167, icon: "☁️", color: "from-amber-500/20 to-amber-600/10", border: "border-amber-500/20" },
  { name: "Microservices", count: 123, icon: "🔗", color: "from-purple-500/20 to-purple-600/10", border: "border-purple-500/20" },
  { name: "GraphQL", count: 65, icon: "📊", color: "from-pink-500/20 to-pink-600/10", border: "border-pink-500/20" },
  { name: "CI/CD", count: 89, icon: "🔄", color: "from-teal-500/20 to-teal-600/10", border: "border-teal-500/20" },
];

function TrendingTopics() {
  const [, setLocation] = useLocation();

  return (
    <section id="topics" className="py-24 relative">
      {/* Subtle background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-violet-500/[0.02] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] mb-4">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-xs font-medium text-white/60">Trending Topics</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Explore <span className="gradient-text">popular topics</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/40 max-w-xl mx-auto">
              Dive into the most sought-after engineering topics with curated practice questions.
            </motion.p>
          </div>
        </AnimatedSection>

        <AnimatedSection className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
          {TRENDING_TOPICS.map((topic, i) => (
            <motion.button
              key={topic.name}
              variants={scaleFade}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLocation(`/channel/${topic.name.toLowerCase().replace(/[^a-z]/g, "-")}`)}
              className={`group relative flex items-center gap-2.5 px-5 py-3 rounded-xl bg-gradient-to-br ${topic.color} border ${topic.border} hover:border-white/20 transition-all`}
            >
              <span className="text-base">{topic.icon}</span>
              <span className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">
                {topic.name}
              </span>
              <span className="text-xs text-white/30">{topic.count}</span>
            </motion.button>
          ))}
        </AnimatedSection>
      </div>
    </section>
  );
}

// ─── Why DevInsights Section ──────────────────────────────────────────────────
const FEATURES = [
  {
    icon: <Mic className="w-5 h-5" />,
    title: "AI Voice Interviews",
    description:
      "Practice speaking your answers out loud with AI that provides real-time feedback on clarity, completeness, and confidence.",
    gradient: "from-violet-600 to-indigo-600",
    shadow: "shadow-violet-500/20",
  },
  {
    icon: <Brain className="w-5 h-5" />,
    title: "Spaced Repetition",
    description:
      "Our SRS algorithm ensures you review concepts at optimal intervals for maximum long-term retention.",
    gradient: "from-cyan-600 to-blue-600",
    shadow: "shadow-cyan-500/20",
  },
  {
    icon: <Target className="w-5 h-5" />,
    title: "Personalized Paths",
    description:
      "Custom learning paths tailored to your target role, experience level, and interview timeline.",
    gradient: "from-emerald-600 to-teal-600",
    shadow: "shadow-emerald-500/20",
  },
  {
    icon: <Code2 className="w-5 h-5" />,
    title: "Code Challenges",
    description:
      "Interactive coding problems with AI-powered hints and instant feedback in Python and JavaScript.",
    gradient: "from-amber-600 to-orange-600",
    shadow: "shadow-amber-500/20",
  },
  {
    icon: <Trophy className="w-5 h-5" />,
    title: "Gamified Progress",
    description:
      "Earn XP, unlock achievements, and maintain streaks. Learning that feels like play.",
    gradient: "from-pink-600 to-rose-600",
    shadow: "shadow-pink-500/20",
  },
  {
    icon: <Shield className="w-5 h-5" />,
    title: "1500+ Questions",
    description:
      "Comprehensive question bank across 30+ topics curated by senior engineers from FAANG companies.",
    gradient: "from-purple-600 to-violet-600",
    shadow: "shadow-purple-500/20",
  },
];

function WhyDevInsights() {
  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.div variants={fadeUp} className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/[0.08] bg-white/[0.03] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-medium text-white/60">Why DevInsights</span>
            </motion.div>
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Everything you need to <span className="gradient-text">ace the interview</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/40 max-w-xl mx-auto">
              A complete interview preparation platform built by engineers, for engineers.
            </motion.p>
          </div>
        </AnimatedSection>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <motion.div
              key={feature.title}
              variants={scaleFade}
              whileHover={{ y: -4 }}
              className="group relative p-[1px] rounded-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.06] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative h-full p-6 rounded-2xl bg-[#0f1629]/80 border border-white/[0.06] group-hover:border-white/[0.12] transition-all">
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg ${feature.shadow} group-hover:scale-110 transition-transform`}
                >
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Testimonial / Social Proof ───────────────────────────────────────────────
const TESTIMONIALS = [
  {
    quote: "Landed my dream job at a FAANG company after 3 months of daily practice. The AI voice interviews were a game changer.",
    name: "Sarah K.",
    role: "Senior SWE @ Meta",
    avatar: "S",
  },
  {
    quote: "The spaced repetition system helped me retain concepts I hadn't touched since college. Absolutely brilliant.",
    name: "Alex M.",
    role: "Staff Engineer @ Stripe",
    avatar: "A",
  },
  {
    quote: "Went from failing phone screens to getting 5 onsite interviews in a month. The practice questions are spot-on.",
    name: "Priya R.",
    role: "SWE II @ Google",
    avatar: "P",
  },
];

function SocialProof() {
  return (
    <section id="community" className="py-24 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent" />

      <div className="relative max-w-7xl mx-auto px-6">
        <AnimatedSection>
          <div className="text-center mb-16">
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Loved by <span className="gradient-text">engineers</span>
            </motion.h2>
            <motion.p variants={fadeUp} className="text-white/40 max-w-xl mx-auto">
              Hear from developers who transformed their interview performance.
            </motion.p>
          </div>
        </AnimatedSection>

        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={t.name}
              variants={scaleFade}
              whileHover={{ y: -4 }}
              className="relative p-6 rounded-2xl bg-[#0f1629] border border-white/[0.06] hover:border-white/[0.12] transition-colors"
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-sm text-white/60 leading-relaxed mb-6 italic">"{t.quote}"</p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.name}</div>
                  <div className="text-xs text-white/40">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Trust badges */}
        <motion.div
          variants={fadeUp}
          className="flex flex-wrap items-center justify-center gap-8 mt-16 pt-16 border-t border-white/[0.06]"
        >
          {[
            { icon: <Users className="w-5 h-5" />, label: "12K+ Active Users" },
            { icon: <CheckCircle2 className="w-5 h-5" />, label: "500K+ Questions Solved" },
            { icon: <Trophy className="w-5 h-5" />, label: "85% Success Rate" },
          ].map((badge) => (
            <div key={badge.label} className="flex items-center gap-2 text-white/30">
              {badge.icon}
              <span className="text-sm font-medium">{badge.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

// ─── Newsletter Signup Section ────────────────────────────────────────────────
function NewsletterSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitted(true);
  };

  return (
    <section className="py-24 relative">
      <AnimatedSection>
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            variants={scaleFade}
            className="relative p-[1px] rounded-3xl overflow-hidden"
          >
            {/* Gradient border */}
            <div className="absolute inset-0 bg-gradient-to-r from-violet-600/50 via-indigo-500/50 to-cyan-500/50" />
            <div className="relative p-8 sm:p-12 rounded-3xl bg-[#0a0e1a]">
              <div className="text-center">
                <motion.div variants={fadeUp} className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600/30 to-cyan-500/20 mb-6">
                  <Mail className="w-6 h-6 text-violet-400" />
                </motion.div>

                <motion.h2 variants={fadeUp} className="text-2xl sm:text-3xl font-bold text-white mb-3">
                  Stay ahead of the curve
                </motion.h2>
                <motion.p variants={fadeUp} className="text-white/40 mb-8 max-w-md mx-auto">
                  Get weekly engineering interview tips, new question drops, and exclusive content
                  delivered to your inbox.
                </motion.p>

                <AnimatePresence mode="wait">
                  {!submitted ? (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      onSubmit={handleSubmit}
                      className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
                    >
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        required
                        className="flex-1 px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.1] text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/20 transition-all"
                      />
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-500 text-white font-semibold text-sm whitespace-nowrap hover:shadow-lg hover:shadow-violet-500/20 transition-shadow"
                      >
                        Subscribe
                      </motion.button>
                    </motion.form>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center justify-center gap-2 text-emerald-400"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">You're in! Check your inbox.</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.p variants={fadeUp} className="text-xs text-white/20 mt-4">
                  No spam, ever. Unsubscribe anytime.
                </motion.p>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────
function LandingFooter() {
  const [, setLocation] = useLocation();

  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div className="sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-cyan-500 flex items-center justify-center">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-bold text-white">
                Dev<span className="gradient-text">Insights</span>
              </span>
            </div>
            <p className="text-sm text-white/30 leading-relaxed max-w-xs">
              The modern platform for engineering interview preparation. Practice smarter,
              not harder.
            </p>
          </div>

          {/* Links */}
          {[
            {
              title: "Product",
              links: [
                { label: "Features", href: "#features" },
                { label: "Learning Paths", href: "/learning-paths" },
                { label: "Voice Interviews", href: "/voice-interview" },
                { label: "Code Challenges", href: "/code" },
              ],
            },
            {
              title: "Resources",
              links: [
                { label: "Blog", href: "/blog" },
                { label: "Documentation", href: "/docs" },
                { label: "Community", href: "#community" },
                { label: "Changelog", href: "/whats-new" },
              ],
            },
            {
              title: "Company",
              links: [
                { label: "About", href: "/about" },
                { label: "GitHub", href: "https://github.com/open-interview" },
                { label: "Contact", href: "/about" },
              ],
            },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="text-sm font-semibold text-white/60 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <button
                      onClick={() => {
                        if (link.href.startsWith("http")) {
                          window.open(link.href, "_blank");
                        } else if (link.href.startsWith("#")) {
                          document.getElementById(link.href.slice(1))?.scrollIntoView({ behavior: "smooth" });
                        } else {
                          setLocation(link.href);
                        }
                      }}
                      className="text-sm text-white/30 hover:text-white/70 transition-colors"
                    >
                      {link.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-white/[0.06]">
          <p className="text-xs text-white/20">
            &copy; {new Date().getFullYear()} DevInsights. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.open("https://github.com/open-interview", "_blank")}
              className="text-white/20 hover:text-white/60 transition-colors"
            >
              <Github className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomeFacelift() {
  return (
    <>
      <SEOHead
        title="DevInsights — Master Engineering Interviews with AI"
        description="Practice system design, algorithms, and behavioral interviews with AI-powered feedback. 1500+ questions across 30+ topics. Join 12,000+ engineers who landed their dream roles."
        canonical="https://open-interview.github.io/"
      />

      <div className="min-h-screen bg-[#0a0e1a] text-white overflow-x-hidden">
        <LandingNavbar />
        <HeroSection />
        <FeaturedArticles />
        <TrendingTopics />
        <WhyDevInsights />
        <SocialProof />
        <NewsletterSection />
        <LandingFooter />
      </div>
    </>
  );
}
