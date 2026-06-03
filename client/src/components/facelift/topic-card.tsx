import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useReducedMotion, getSpringTransition } from '@/hooks/use-reduced-motion';

export interface TopicCardData {
  id: string;
  name: string;
  slug: string;
  icon?: React.ReactNode;
  count: number;
  description?: string;
  href?: string;
  onClick?: () => void;
}

interface TopicCardProps {
  topic: TopicCardData;
  className?: string;
  index?: number;
}

const topicGradients: Record<string, string> = {
  'system-design': 'from-violet-600/20 via-violet-500/10 to-indigo-600/20 hover:from-violet-600/30 hover:via-violet-500/20 hover:to-indigo-600/30',
  'algorithms': 'from-cyan-600/20 via-cyan-500/10 to-blue-600/20 hover:from-cyan-600/30 hover:via-cyan-500/20 hover:to-blue-600/30',
  'frontend': 'from-pink-600/20 via-pink-500/10 to-rose-600/20 hover:from-pink-600/30 hover:via-pink-500/20 hover:to-rose-600/30',
  'backend': 'from-emerald-600/20 via-emerald-500/10 to-teal-600/20 hover:from-emerald-600/30 hover:via-emerald-500/20 hover:to-teal-600/30',
  'devops': 'from-orange-600/20 via-orange-500/10 to-amber-600/20 hover:from-orange-600/30 hover:via-orange-500/20 hover:to-amber-600/30',
  'ai-ml': 'from-purple-600/20 via-purple-500/10 to-violet-600/20 hover:from-purple-600/30 hover:via-purple-500/20 hover:to-violet-600/30',
  'database': 'from-sky-600/20 via-sky-500/10 to-cyan-600/20 hover:from-sky-600/30 hover:via-sky-500/20 hover:to-cyan-600/30',
  'security': 'from-red-600/20 via-red-500/10 to-rose-600/20 hover:from-red-600/30 hover:via-red-500/20 hover:to-rose-600/30',
  'testing': 'from-lime-600/20 via-lime-500/10 to-green-600/20 hover:from-lime-600/30 hover:via-lime-500/20 hover:to-green-600/30',
  'kubernetes': 'from-blue-600/20 via-blue-500/10 to-indigo-600/20 hover:from-blue-600/30 hover:via-blue-500/20 hover:to-indigo-600/30',
  'aws': 'from-yellow-600/20 via-yellow-500/10 to-orange-600/20 hover:from-yellow-600/30 hover:via-yellow-500/20 hover:to-orange-600/30',
  'react': 'from-cyan-500/20 via-sky-500/10 to-blue-600/20 hover:from-cyan-500/30 hover:via-sky-500/20 hover:to-blue-600/30',
  'javascript': 'from-yellow-500/20 via-amber-500/10 to-orange-600/20 hover:from-yellow-500/30 hover:via-amber-500/20 hover:to-orange-600/30',
  'python': 'from-blue-500/20 via-violet-500/10 to-indigo-600/20 hover:from-blue-500/30 hover:via-violet-500/20 hover:to-indigo-600/30',
  'behavioral': 'from-teal-600/20 via-teal-500/10 to-emerald-600/20 hover:from-teal-600/30 hover:via-teal-500/20 hover:to-emerald-600/30',
  'data-structures': 'from-indigo-600/20 via-indigo-500/10 to-violet-600/20 hover:from-indigo-600/30 hover:via-indigo-500/20 hover:to-violet-600/30',
};

function getTopicGradient(slug: string): string {
  return topicGradients[slug] || 'from-violet-600/20 via-violet-500/10 to-cyan-600/20 hover:from-violet-600/30 hover:via-violet-500/20 hover:to-cyan-600/30';
}

function getTopicAccent(slug: string): string {
  const accentMap: Record<string, string> = {
    'system-design': 'text-violet-400',
    'algorithms': 'text-cyan-400',
    'frontend': 'text-pink-400',
    'backend': 'text-emerald-400',
    'devops': 'text-orange-400',
    'ai-ml': 'text-purple-400',
    'database': 'text-sky-400',
    'security': 'text-red-400',
    'testing': 'text-lime-400',
    'kubernetes': 'text-blue-400',
    'aws': 'text-yellow-400',
    'react': 'text-cyan-400',
    'javascript': 'text-amber-400',
    'python': 'text-blue-400',
    'behavioral': 'text-teal-400',
    'data-structures': 'text-indigo-400',
  };
  return accentMap[slug] || 'text-violet-400';
}

function getTopicIconBg(slug: string): string {
  const bgMap: Record<string, string> = {
    'system-design': 'bg-violet-500/15',
    'algorithms': 'bg-cyan-500/15',
    'frontend': 'bg-pink-500/15',
    'backend': 'bg-emerald-500/15',
    'devops': 'bg-orange-500/15',
    'ai-ml': 'bg-purple-500/15',
    'database': 'bg-sky-500/15',
    'security': 'bg-red-500/15',
    'testing': 'bg-lime-500/15',
    'kubernetes': 'bg-blue-500/15',
    'aws': 'bg-yellow-500/15',
    'react': 'bg-cyan-500/15',
    'javascript': 'bg-amber-500/15',
    'python': 'bg-blue-500/15',
    'behavioral': 'bg-teal-500/15',
    'data-structures': 'bg-indigo-500/15',
  };
  return bgMap[slug] || 'bg-violet-500/15';
}

const defaultIcons: Record<string, string> = {
  'system-design': '🏗️',
  'algorithms': '⚡',
  'frontend': '🎨',
  'backend': '⚙️',
  'devops': '🚀',
  'ai-ml': '🧠',
  'database': '🗄️',
  'security': '🔒',
  'testing': '🧪',
  'kubernetes': '☸️',
  'aws': '☁️',
  'react': '⚛️',
  'javascript': '📜',
  'python': '🐍',
  'behavioral': '💬',
  'data-structures': '📊',
};

export function TopicCard({ topic, className, index = 0 }: TopicCardProps) {
  const prefersReducedMotion = useReducedMotion();
  const spring = getSpringTransition(prefersReducedMotion);
  const gradient = getTopicGradient(topic.slug);
  const accent = getTopicAccent(topic.slug);
  const iconBg = getTopicIconBg(topic.slug);

  const content = (
    <div
      className={cn(
        'group relative flex flex-col overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br p-5 transition-colors duration-300',
        gradient,
        className,
      )}
    >
      <div className="flex items-start gap-4">
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl transition-transform duration-300 group-hover:scale-110', iconBg)}>
          {topic.icon || <span aria-hidden="true">{defaultIcons[topic.slug] || '📁'}</span>}
          <span className="sr-only">{topic.name}</span>
        </div>

        <div className="flex-1 min-w-0">
          <h3 className={cn('text-base font-semibold leading-tight transition-colors', accent)}>
            {topic.name}
          </h3>

          {topic.description && (
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {topic.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <span className="inline-flex items-center rounded-full bg-foreground/5 px-2.5 py-1 text-xs font-medium text-muted-foreground">
          {topic.count} {topic.count === 1 ? 'article' : 'articles'}
        </span>

        <span className={cn('text-xs font-medium transition-colors', accent)}>
          Explore →
        </span>
      </div>

      <div className="absolute -right-4 -bottom-4 h-24 w-24 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl transition-opacity opacity-0 group-hover:opacity-100" />
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ ...spring, delay: prefersReducedMotion ? 0 : index * 0.05 }}
      whileHover={!prefersReducedMotion ? { scale: 1.03, transition: spring } : undefined}
      className="group block h-full"
      onClick={topic.onClick}
    >
      {topic.href ? (
        <a href={topic.href} className="block h-full" aria-label={`Explore ${topic.name}: ${topic.count} articles`}>
          {content}
        </a>
      ) : (
        content
      )}
    </motion.div>
  );
}

export function TopicCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col overflow-hidden rounded-xl border border-border/50 bg-card p-5 animate-pulse', className)}>
      <div className="flex items-start gap-4">
        <div className="h-12 w-12 shrink-0 rounded-xl bg-muted/50" />
        <div className="flex-1 space-y-2">
          <div className="h-5 w-24 rounded bg-muted/50" />
          <div className="h-3 w-full rounded bg-muted/50" />
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <div className="h-6 w-20 rounded-full bg-muted/50" />
        <div className="h-4 w-16 rounded bg-muted/50" />
      </div>
    </div>
  );
}
