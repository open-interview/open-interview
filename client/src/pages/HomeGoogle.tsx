/**
 * Google-Style Home Page
 * Clean, minimal, Material Design 3 inspired
 * Features: Hero section, feature cards, Google dots indicators, smooth animations
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import {
  BookOpen, Mic, Target, Code, ChevronRight,
  Zap, Award, TrendingUp, Brain, Sparkles, Play,
} from 'lucide-react';
import HeroGraphic from '../components/google/HeroGraphic';
import FeatureGraphic from '../components/google/FeatureGraphic';
import CTAGraphic from '../components/google/CTAGraphic';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const stagger = {
  show: { transition: { staggerChildren: 0.1 } }
};

export const GoogleColors = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC04',
  green: '#34A853',
};

function WaveDivider({ flip = false }: { flip?: boolean }) {
  return (
    <div className={`w-full overflow-hidden leading-none ${flip ? 'scale-y-[-1]' : ''}`}>
      <svg viewBox="0 0 1200 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-10" preserveAspectRatio="none">
        <path d="M0 30C200 0 400 60 600 30C800 0 1000 60 1200 30V60H0V30Z" fill="currentColor" className="text-background" />
      </svg>
    </div>
  );
}

function GoogleDotsPattern({ className = '' }: { className?: string }) {
  const colors = [GoogleColors.blue, GoogleColors.red, GoogleColors.yellow, GoogleColors.green];
  const dots = [];
  for (let i = 0; i < 20; i++) {
    dots.push(
      <motion.div
        key={i}
        className="absolute w-1.5 h-1.5 rounded-full"
        style={{
          backgroundColor: colors[i % 4],
          left: `${5 + (i % 5) * 22}%`,
          top: `${10 + Math.floor(i / 5) * 25}%`,
          opacity: 0.2,
        }}
        animate={{ y: [0, -6, 0], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 5 + (i % 3), repeat: Infinity, ease: 'easeInOut', delay: i * 0.2 }}
      />
    );
  }
  return <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>{dots}</div>;
}

function AbstractShapes({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}>
      <motion.div
        className="absolute top-4 right-4 w-20 h-20 rounded-full opacity-10"
        style={{ background: `linear-gradient(135deg, ${GoogleColors.blue}, ${GoogleColors.green})` }}
        animate={{ scale: [1, 1.1, 1], rotate: [0, 15, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute bottom-8 left-8 w-16 h-16 rounded-2xl opacity-10"
        style={{ background: `linear-gradient(135deg, ${GoogleColors.red}, ${GoogleColors.yellow})` }}
        animate={{ y: [0, -10, 0], rotate: [0, -10, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="absolute top-1/2 left-4 w-12 h-12 rounded-full opacity-10"
        style={{ backgroundColor: GoogleColors.yellow }}
        animate={{ scale: [1, 1.15, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
      />
    </div>
  );
}

function CelebrationDots() {
  const dots = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const x = 50 + Math.cos(angle) * 35;
    const y = 50 + Math.sin(angle) * 35;
    const colors = [GoogleColors.blue, GoogleColors.red, GoogleColors.yellow, GoogleColors.green];
    dots.push(
      <motion.div
        key={i}
        className="absolute w-2 h-2 rounded-full"
        style={{
          backgroundColor: colors[i % 4],
          left: `${x}%`,
          top: `${y}%`,
          opacity: 0.25,
        }}
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.25 }}
      />
    );
  }
  return <div className="absolute inset-0 pointer-events-none">{dots}</div>;
}

function GoogleDots({ active = 0 }: { active?: number }) {
  const colors = [GoogleColors.blue, GoogleColors.red, GoogleColors.yellow, GoogleColors.green];
  return (
    <div className="flex items-center gap-1.5">
      {colors.map((color, i) => (
        <motion.div
          key={i}
          className="w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: color,
            opacity: i === active ? 1 : 0.4,
          }}
          animate={{ scale: i === active ? 1.2 : 1 }}
          transition={{ duration: 0.3 }}
        />
      ))}
    </div>
  );
}

function FeatureCard({ 
  icon: Icon, 
  title, 
  subtitle, 
  color, 
  onClick,
  delay = 0
}: { 
  icon: React.ElementType; 
  title: string; 
  subtitle: string; 
  color: string; 
  onClick: () => void;
  delay?: number;
}) {
  return (
    <motion.button
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="group relative flex flex-col gap-3 p-5 rounded-xl bg-card text-left hover:shadow-sm transition-all duration-200"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' }}
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br ${color} shadow-sm`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <div>
        <div className="font-medium text-foreground text-sm">{title}</div>
        <div className="text-xs text-muted-foreground mt-0.5">{subtitle}</div>
      </div>
      <ChevronRight className="absolute top-5 right-4 w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all duration-200" />
    </motion.button>
  );
}

function HeroSection({ onStart }: { onStart: () => void }) {
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return (
    <section className="relative py-16 px-4 overflow-hidden">
      {!prefersReducedMotion && (
        <>
          <HeroGraphic className="opacity-60 dark:opacity-40" />
          <CelebrationDots />
          <GoogleDotsPattern />
        </>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-2xl mx-auto text-center"
      >
        <div className="flex justify-center mb-4">
          <GoogleDots />
        </div>
        
        <h1 
          className="text-4xl md:text-5xl font-normal tracking-tight"
          style={{ 
            fontFamily: "'Google Sans Display', 'Roboto', sans-serif",
            fontWeight: 400,
            letterSpacing: '-0.02em',
          }}
        >
          <span className="text-foreground">Master your </span>
          <span className="text-[#4285F4]">technical</span>
          <span className="text-foreground"> interviews</span>
        </h1>
        
        <p 
          className="mt-4 text-lg text-muted-foreground max-w-lg mx-auto"
          style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400 }}
        >
          Practice with AI-powered voice interviews. Build confidence. Land your dream job.
        </p>
        
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="group flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all duration-200 h-10"
            style={{ 
              background: 'linear-gradient(135deg, #4285F4 0%, #3367D6 100%)',
              boxShadow: '0 2px 8px rgba(66, 133, 244, 0.3)',
            }}
          >
            <Play className="w-4 h-4 fill-current" />
            Start Practicing
          </motion.button>
          
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-foreground hover:bg-muted/50 transition-colors duration-200 h-10"
          >
            Learn more
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 flex items-center justify-center gap-8 text-sm"
        >
          {[
            ['12K+', 'Learners'],
            ['500K+', 'Questions'],
            ['95%', 'Satisfaction'],
          ].map(([num, label]) => (
            <div key={label} className="text-center">
              <div className="font-medium text-foreground" style={{ fontWeight: 500 }}>{num}</div>
              <div className="text-muted-foreground text-xs">{label}</div>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}

function StatsSection() {
  const stats = [
    { icon: Zap, value: '50+', label: 'Topics', color: GoogleColors.blue },
    { icon: Brain, value: '500+', label: 'Questions', color: GoogleColors.red },
    { icon: Award, value: '12K+', label: 'Users', color: GoogleColors.green },
    { icon: TrendingUp, value: '85%', label: 'Success', color: GoogleColors.yellow },
  ];
  
  return (
    <section className="py-8 px-4 bg-muted/30">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="flex items-center justify-center gap-8 md:gap-16 flex-wrap"
        >
          {stats.map(({ icon: Icon, value, label, color }, i) => (
            <motion.div 
              key={label}
              variants={fadeUp}
              className="flex items-center gap-2"
            >
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="font-medium text-foreground text-sm" style={{ fontWeight: 500 }}>{value}</div>
                <div className="text-muted-foreground text-xs">{label}</div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function FeaturesSection({ onNavigate }: { onNavigate: (path: string) => void }) {
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const features = [
    {
      icon: BookOpen,
      title: 'Swipe Learn',
      subtitle: 'Browse questions like social media',
      color: 'from-[#4285F4] to-[#3367D6]',
      onClick: () => onNavigate('/channels'),
    },
    {
      icon: Mic,
      title: 'Voice Interview',
      subtitle: 'AI-powered mock interviews',
      color: 'from-[#34A853] to-[#2E7D32]',
      onClick: () => onNavigate('/voice-interview'),
    },
    {
      icon: Target,
      title: 'Daily Quiz',
      subtitle: 'Test your knowledge daily',
      color: 'from-[#EA4335] to-[#C62828]',
      onClick: () => onNavigate('/tests'),
    },
    {
      icon: Code,
      title: 'Code Challenges',
      subtitle: 'Practice coding problems',
      color: 'from-[#FBBC04] to-[#F9A825]',
      onClick: () => onNavigate('/code'),
    },
  ];
  
  return (
    <section className="relative py-12 px-4">
      {!prefersReducedMotion && (
        <>
          <FeatureGraphic variant="left" className="opacity-50 dark:opacity-30 left-0 -translate-x-1/3" />
          <FeatureGraphic variant="right" className="opacity-50 dark:opacity-30 right-0 translate-x-1/3" />
        </>
      )}
      <div className="relative max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-8"
        >
          <h2 className="text-2xl font-normal text-foreground" style={{ fontFamily: "'Google Sans Display', 'Roboto', sans-serif" }}>
            Everything you need
          </h2>
          <p className="mt-2 text-muted-foreground text-sm">
            Comprehensive tools to ace your technical interviews
          </p>
        </motion.div>
        
        <motion.div 
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        >
          {features.map((feature, i) => (
            <FeatureCard 
              key={feature.title}
              {...feature}
              delay={i * 0.1}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function CTASection({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative py-16 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="relative max-w-2xl mx-auto p-6 rounded-xl overflow-hidden text-center"
        style={{ 
          background: 'linear-gradient(135deg, rgba(66, 133, 244, 0.1) 0%, rgba(52, 168, 83, 0.1) 100%)',
          border: '1px solid rgba(66, 133, 244, 0.15)',
        }}
      >
        <CTAGraphic className="opacity-50 dark:opacity-30" />
        <div className="relative z-10">
          <Sparkles className="w-6 h-6 mx-auto text-[#4285F4] mb-4" />
          <h2 className="text-2xl font-normal text-foreground" style={{ fontFamily: "'Google Sans Display', 'Roboto', sans-serif" }}>
            Ready to get started?
          </h2>
          <p className="mt-2 text-muted-foreground text-sm max-w-xs mx-auto">
            Join thousands of developers who improved their interview skills
          </p>
          
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStart}
            className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium text-white mx-auto transition-all duration-200 h-10"
            style={{ 
              background: 'linear-gradient(135deg, #34A853 0%, #2E7D32 100%)',
              boxShadow: '0 2px 8px rgba(52, 168, 83, 0.3)',
            }}
          >
            Start your first interview
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </motion.div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="py-8 px-4 border-t border-border/40">
      <div className="max-w-3xl mx-auto text-center">
        <div className="flex justify-center mb-4">
          <GoogleDots active={0} />
        </div>
        <p className="text-xs text-muted-foreground">
          © 2026 CodeReels. Built with ♥ for developers.
        </p>
      </div>
    </footer>
  );
}

export default function HomeGoogle() {
  const [, setLocation] = useLocation();
  
  const handleStart = () => setLocation('/training');
  
  return (
    <div className="min-h-screen bg-background">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <HeroSection onStart={handleStart} />
        <WaveDivider />
        <StatsSection />
        <WaveDivider />
        <FeaturesSection onNavigate={setLocation} />
        <WaveDivider />
        <CTASection onStart={handleStart} />
        <Footer />
      </motion.div>
    </div>
  );
}