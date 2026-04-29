/**
 * Google-Style About Page
 * Clean, minimal, Material Design 3 inspired
 * Features: Hero section, feature cards, team section, clean lists, footer
 */

import React from 'react';
import { motion } from 'framer-motion';
import { useLocation } from 'wouter';
import { SEOHead } from '../components/SEOHead';
import { AppLayout } from '../components/layout/AppLayout';
import {
  Brain, Code, Target, Zap, Sparkles, Mic,
  Github, Linkedin, Twitter, Globe, Mail,
  Users, Rocket, Heart, Coffee, ExternalLink,
  Play, ArrowRight, CheckCircle, Star,
} from 'lucide-react';

const GoogleColors = {
  blue: '#4285F4',
  red: '#EA4335',
  yellow: '#FBBC04',
  green: '#34A853',
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const stagger = {
  show: { transition: { staggerChildren: 0.08 } }
};

function GoogleDots({ size = 'sm' }: { size?: 'sm' | 'lg' }) {
  const colors = [GoogleColors.blue, GoogleColors.red, GoogleColors.yellow, GoogleColors.green];
  const dotSize = size === 'lg' ? 'w-2.5 h-2.5' : 'w-2 h-2';
  const gap = size === 'lg' ? 'gap-2' : 'gap-1.5';
  
  return (
    <div className={`flex items-center ${gap}`}>
      {colors.map((color, i) => (
        <div
          key={i}
          className={`${dotSize} rounded-full`}
          style={{ backgroundColor: color }}
        />
      ))}
    </div>
  );
}

function HeroSection() {
  const [, setLocation] = useLocation();
  
  return (
    <section className="relative py-20 px-4 overflow-hidden">
      <motion.div 
        className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-10"
        style={{ background: `linear-gradient(135deg, ${GoogleColors.blue}, ${GoogleColors.green})` }}
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.08, 0.15, 0.08],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative max-w-2xl mx-auto text-center"
      >
        <div className="flex justify-center mb-6">
          <GoogleDots size="lg" />
        </div>
        
        <h1 
          className="text-4xl md:text-5xl font-normal tracking-tight"
          style={{ 
            fontFamily: "'Google Sans Display', 'Roboto', sans-serif",
            fontWeight: 400,
            letterSpacing: '-0.02em',
          }}
        >
          <span className="text-foreground">About </span>
          <span className="text-[#4285F4]">Code Reels</span>
        </h1>
        
        <p 
          className="mt-5 text-lg text-foreground/70 max-w-lg mx-auto leading-relaxed"
          style={{ fontFamily: "'Roboto', sans-serif", fontWeight: 400 }}
        >
          Your AI-powered interview preparation companion. Practice, learn, and succeed.
        </p>
        
        <motion.div 
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-8 flex justify-center"
        >
          <button
            onClick={() => setLocation('/voice-interview')}
            className="inline-flex items-center gap-2 px-6 py-2 bg-[#4285F4] text-white rounded-full font-medium text-sm hover:bg-[#3367d6] transition-colors shadow-sm h-10"
            style={{ fontFamily: "'Roboto', sans-serif" }}
          >
            <Play className="w-4 h-4" /> Start Practicing
          </button>
        </motion.div>
      </motion.div>
    </section>
  );
}

const features = [
  { icon: Brain, title: 'AI-Powered Questions', desc: 'Smart questions generated daily', color: 'from-[#4285F4] to-[#3367d6]' },
  { icon: Mic, title: 'Voice Practice', desc: 'Speak and practice out loud', color: 'from-[#34A853] to-[#2d8f47]' },
  { icon: Target, title: 'Real Interview Prep', desc: 'FAANG-style questions', color: 'from-[#EA4335] to-[#c5221f]' },
  { icon: Zap, title: 'Instant Feedback', desc: 'Get AI-powered insights', color: 'from-[#FBBC04] to-[#e9a800]' },
  { icon: Sparkles, title: 'Daily Updates', desc: 'Fresh content every day', color: 'from-[#4285F4] to-[#9c27b0]' },
  { icon: Code, title: 'Code Examples', desc: 'Production-ready snippets', color: 'from-[#34A853] to-[#4285F4]' },
];

function FeatureCard({ 
  icon: Icon, 
  title, 
  desc, 
  color,
  delay = 0
}: { 
  icon: React.ElementType; 
  title: string; 
  desc: string; 
  color: string;
  delay?: number;
}) {
  return (
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      transition={{ delay }}
      className="group p-5 rounded-2xl bg-card border border-border/60 hover:border-border hover:shadow-lg hover:shadow-black/5 transition-all duration-200"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04)' }}
    >
      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center bg-gradient-to-br ${color} shadow-sm mb-4`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <h3 className="font-medium text-foreground text-base">{title}</h3>
      <p className="text-sm text-foreground/70 mt-1">{desc}</p>
    </motion.div>
  );
}

function FeaturesSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-normal text-foreground"
            style={{ fontFamily: "'Google Sans Display', 'Roboto', sans-serif", letterSpacing: '-0.01em' }}>
            Everything you need to ace your interview
          </h2>
          <p className="mt-3 text-foreground/70 max-w-md mx-auto">
            Powerful features designed to help you succeed
          </p>
        </motion.div>
        
        <motion.div 
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {features.map((f, i) => (
            <FeatureCard key={f.title} {...f} delay={i * 0.08} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const stats = [
  { value: '1000+', label: 'Questions' },
  { value: '10+', label: 'Channels' },
  { value: 'Daily', label: 'Updates' },
  { value: 'Free', label: 'Forever' },
];

function StatsSection() {
  return (
    <section className="py-16 px-4 bg-card/50">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center"
            >
              <div 
                className="text-3xl md:text-4xl font-medium"
                style={{ fontFamily: "'Google Sans Display', 'Roboto', sans-serif", color: GoogleColors.blue }}
              >
                {stat.value}
              </div>
              <div className="text-sm text-foreground/70 mt-1">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const team = [
  { name: 'Satishkumar Dhule', role: 'Creator & Developer', link: 'https://satishkumar-dhule.github.io/', github: 'satishkumar-dhule', linkedin: 'satishkumar-dhule' },
];

function TeamSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-normal text-foreground"
            style={{ fontFamily: "'Google Sans Display', 'Roboto', sans-serif", letterSpacing: '-0.01em' }}>
            Meet the Team
          </h2>
          <p className="mt-3 text-foreground/70">
            Built with care by developers, for developers
          </p>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          {team.map((member) => (
            <div key={member.name} className="flex flex-col items-center p-6 rounded-xl bg-card">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#4285F4] to-[#34A853] flex items-center justify-center">
                <span className="text-2xl font-medium text-white">
                  {member.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h3 className="mt-4 font-medium text-foreground">{member.name}</h3>
              <p className="text-sm text-foreground/70">{member.role}</p>
              <div className="flex gap-3 mt-4">
                <a
                  href={member.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-muted hover:bg-[#4285F4] hover:text-white transition-colors"
                  aria-label="Website"
                >
                  <Globe className="w-4 h-4" />
                </a>
                <a
                  href={`https://github.com/${member.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-muted hover:bg-[#24292e] hover:text-white transition-colors"
                  aria-label="GitHub"
                >
                  <Github className="w-4 h-4" />
                </a>
                <a
                  href={`https://linkedin.com/in/${member.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-muted hover:bg-[#0a66c2] hover:text-white transition-colors"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

const values = [
  { title: 'Free Forever', desc: 'No paywalls, no subscriptions. Everyone deserves quality prep.' },
  { title: 'Open Source', desc: 'Community-driven, transparent, and collaborative.' },
  { title: 'AI-Powered', desc: 'Smart questions that adapt to your learning style.' },
];

function ValuesSection() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-3xl font-normal text-foreground"
            style={{ fontFamily: "'Google Sans Display', 'Roboto', sans-serif", letterSpacing: '-0.01em' }}>
            Our Values
          </h2>
        </motion.div>
        
        <div className="grid md:grid-cols-3 gap-6">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="text-center p-5"
            >
              <CheckCircle className="min-w-[48px] w-8 min-h-[48px] h-8 mx-auto mb-3" style={{ color: GoogleColors.green }} />
              <h3 className="font-medium text-foreground">{v.title}</h3>
              <p className="text-sm text-foreground/70 mt-2">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

const links = [
  { icon: Github, label: 'GitHub', href: 'https://github.com/open-interview/open-interview' },
  { icon: Star, label: 'Star us', href: 'https://github.com/open-interview/open-interview' },
  { icon: Mail, label: 'Contact', href: 'mailto:hello@codereels.dev' },
];

function Footer() {
  return (
    <footer className="py-12 px-4 border-t border-border">
      <div className="max-w-2xl mx-auto text-center">
        <div className="flex justify-center mb-6">
          <GoogleDots />
        </div>
        
        <p className="text-sm text-foreground/70 mb-6">
          Made with <Heart className="w-4 h-4 inline text-red-500" /> and <Coffee className="w-4 h-4 inline text-amber-500" /> by developers, for developers
        </p>
        
        <div className="flex justify-center gap-4 mb-6">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm text-foreground/70 hover:text-foreground hover:bg-muted rounded-full transition-colors"
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </a>
          ))}
        </div>
        
        <div className="text-xs text-foreground/70">
          <span>Open Source</span>
          <span className="mx-2">·</span>
          <span>MIT License</span>
          <span className="mx-2">·</span>
          <span>© 2024 Code Reels</span>
        </div>
      </div>
    </footer>
  );
}

export default function AboutGoogle() {
  return (
    <>
      <SEOHead
        title="About Code Reels - AI-Powered Interview Prep"
        description="Code Reels is a free, open-source platform with 1000+ technical interview questions. Features AI-generated content, voice practice, progress tracking, and FAANG-style prep."
        keywords="about code reels, interview prep, ai learning, technical interviews"
      />
      <AppLayout title="About" showBackOnMobile>
        <div className="min-h-screen">
          <HeroSection />
          <StatsSection />
          <FeaturesSection />
          <ValuesSection />
          <TeamSection />
          <Footer />
        </div>
      </AppLayout>
    </>
  );
}