import { Link } from "wouter";
import {
  Github,
  Twitter,
  Linkedin,
  ArrowUp,
  Mail,
  BookOpen,
  Code,
  Mic,
  Target,
  Flame,
  Layers,
  Brain,
  Award,
  Cloud,
} from "lucide-react";
import { useState } from "react";

const categoryLinks = [
  {
    heading: "Fundamentals",
    icon: BookOpen,
    links: [
      { label: "Data Structures", href: "/channel/data-structures" },
      { label: "Algorithms", href: "/channel/algorithms" },
      { label: "Design Patterns", href: "/channel/design-patterns" },
      { label: "Complexity Analysis", href: "/channel/complexity-analysis" },
    ],
  },
  {
    heading: "Engineering",
    icon: Code,
    links: [
      { label: "System Design", href: "/channel/system-design" },
      { label: "Frontend", href: "/channel/frontend" },
      { label: "Backend", href: "/channel/backend" },
      { label: "Database", href: "/channel/database" },
    ],
  },
  {
    heading: "Cloud & DevOps",
    icon: Cloud,
    links: [
      { label: "AWS", href: "/channel/aws" },
      { label: "Kubernetes", href: "/channel/kubernetes" },
      { label: "Docker", href: "/channel/docker" },
      { label: "Terraform", href: "/channel/terraform" },
    ],
  },
  {
    heading: "AI & Security",
    icon: Brain,
    links: [
      { label: "Machine Learning", href: "/channel/machine-learning" },
      { label: "Generative AI", href: "/channel/generative-ai" },
      { label: "Security", href: "/channel/security" },
      { label: "Data Engineering", href: "/channel/data-engineering" },
    ],
  },
];

const practiceLinks = [
  { label: "Voice Interview", href: "/voice-interview", icon: Mic, badge: "Popular" },
  { label: "Quick Tests", href: "/tests", icon: Target },
  { label: "Code Challenges", href: "/code", icon: Code, badge: "New" },
  { label: "SRS Review", href: "/review", icon: Flame },
  { label: "Flashcards", href: "/flashcards", icon: Layers, badge: "New" },
  { label: "Certifications", href: "/certifications", icon: Award },
];

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "All Channels", href: "/channels" },
  { label: "Learning Paths", href: "/learning-paths" },
  { label: "Blog", href: "/blog" },
  { label: "Documentation", href: "/docs" },
  { label: "About", href: "/about" },
];

const socialLinks = [
  { icon: Github, label: "GitHub", href: "https://github.com/open-interview" },
  { icon: Twitter, label: "Twitter", href: "https://twitter.com" },
  { icon: Linkedin, label: "LinkedIn", href: "https://linkedin.com" },
];

export function FaceliftFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email && email.includes("@")) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 3000);
    }
  };

  return (
    <footer className="relative mt-20">
      {/* Decorative top border with gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      {/* Gradient background */}
      <div className="bg-gradient-to-b from-background via-background to-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Main footer content */}
          <div className="py-12 lg:py-16">
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12">
              {/* Brand section - spans 4 columns */}
              <div className="lg:col-span-4">
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-500 flex items-center justify-center"
                    style={{ boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}
                  >
                    <Mic className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-lg leading-tight">OpenInterview</h2>
                    <p className="text-[10px] text-muted-foreground tracking-wider uppercase">
                      Technical Blog
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mb-6">
                  Master technical interviews with 1000+ curated questions across 30+
                  channels. Voice practice, spaced repetition, coding challenges, and
                  gamified learning — all free.
                </p>

                {/* Social links */}
                <div className="flex items-center gap-3">
                  {socialLinks.map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="group flex items-center justify-center w-9 h-9 rounded-lg bg-muted/50 border border-border/50 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-all duration-200"
                      data-testid={`link-social-${label.toLowerCase()}`}
                    >
                      <Icon
                        size={16}
                        strokeWidth={1.5}
                        className="group-hover:scale-110 transition-transform duration-200"
                      />
                    </a>
                  ))}
                </div>

                {/* Newsletter signup */}
                <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail size={14} className="text-muted-foreground" />
                    <h3 className="text-sm font-medium">Weekly Interview Tips</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    New questions, strategies, and insights — straight to your inbox.
                  </p>
                  <form onSubmit={handleSubscribe} className="flex gap-2">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@email.com"
                      className="flex-1 min-w-0 px-3 py-1.5 text-sm rounded-lg bg-background/80 border border-border/50 text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all"
                      aria-label="Email for newsletter"
                      data-testid="input-newsletter-email"
                    />
                    <button
                      type="submit"
                      disabled={subscribed}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 whitespace-nowrap ${
                        subscribed
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-primary/15 text-primary border border-primary/20 hover:bg-primary/25 hover:border-primary/40"
                      }`}
                      data-testid="button-newsletter-subscribe"
                    >
                      {subscribed ? "You're in!" : "Subscribe"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Quick Links - spans 2 columns */}
              <div className="lg:col-span-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/80 mb-4">
                  Quick Links
                </h3>
                <ul className="space-y-2.5">
                  {quickLinks.map(({ label, href }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="group text-sm text-muted-foreground hover:text-primary transition-colors duration-150 flex items-center gap-1.5"
                        data-testid={`link-quick-${label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <span className="w-0 group-hover:w-1.5 h-px bg-primary transition-all duration-200" />
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Practice - spans 3 columns */}
              <div className="lg:col-span-3">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-foreground/80 mb-4">
                  Practice
                </h3>
                <ul className="space-y-2.5">
                  {practiceLinks.map(({ label, href, icon: Icon, badge }) => (
                    <li key={href}>
                      <Link
                        href={href}
                        className="group text-sm text-muted-foreground hover:text-primary transition-colors duration-150 flex items-center gap-2"
                        data-testid={`link-practice-${label.toLowerCase().replace(/\s+/g, '-')}`}
                      >
                        <Icon
                          size={14}
                          strokeWidth={1.5}
                          className="text-muted-foreground/60 group-hover:text-primary/70 transition-colors duration-150"
                        />
                        {label}
                        {badge && (
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                              badge === "New"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-amber-500/20 text-amber-400"
                            }`}
                          >
                            {badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Topics - spans 3 columns */}
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-6">
                  {categoryLinks.map(({ heading, links }) => (
                    <div key={heading}>
                      <h3 className="text-sm font-semibold text-foreground/80 mb-3">
                        {heading}
                      </h3>
                      <ul className="space-y-2">
                        {links.map(({ label, href }) => (
                          <li key={href}>
                            <Link
                              href={href}
                              className="group text-sm text-muted-foreground hover:text-primary transition-colors duration-150 flex items-center gap-1.5"
                              data-testid={`link-topic-${label.toLowerCase().replace(/\s+/g, '-')}`}
                            >
                              <span className="w-0 group-hover:w-1.5 h-px bg-primary transition-all duration-200" />
                              {label}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="py-6 border-t border-border/50">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-3 text-xs text-muted-foreground">
                <span>&copy; {new Date().getFullYear()} OpenInterview. All rights reserved.</span>
                <span className="hidden sm:inline text-border">|</span>
                <span>Open Source</span>
                <span className="hidden sm:inline text-border">&middot;</span>
                <span>MIT License</span>
                <span className="hidden sm:inline text-border">&middot;</span>
                <a
                  href="https://github.com/open-interview"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary transition-colors duration-150"
                >
                  GitHub
                </a>
              </div>

              <button
                onClick={scrollToTop}
                className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors duration-150"
                aria-label="Back to top"
                data-testid="button-back-to-top"
              >
                <span>Back to top</span>
                <ArrowUp
                  size={14}
                  strokeWidth={1.5}
                  className="group-hover:-translate-y-0.5 transition-transform duration-200"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
