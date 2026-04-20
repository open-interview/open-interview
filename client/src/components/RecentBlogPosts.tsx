/**
 * Recent Blog Posts Component
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api.service';
import { FileText, ExternalLink, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { PageLoader, SectionHeader } from './ui/page';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  url: string;
}

interface RecentBlogPostsProps {
  limit?: number;
  className?: string;
}

const BLOG_BASE = 'https://openstackdaily.github.io';

export function RecentBlogPosts({ limit = 3, className = '' }: RecentBlogPostsProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.blog.getAll()
      .then(all => {
        const sorted = Object.entries(all)
          .map(([id, info]) => ({ id, ...(info as Omit<BlogPost, 'id'>) }))
          .sort((a, b) => {
            const ts = (id: string) => parseInt(id.match(/blog-(\d+)/)?.[1] ?? '0', 10);
            return ts(b.id) - ts(a.id);
          })
          .slice(0, limit);
        setPosts(sorted);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [limit]);

  if (isLoading) {
    return (
      <section className={`mb-3 ${className}`}>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <SectionHeader title="From the Blog" icon={<Sparkles className="w-4 h-4 text-primary" />} />
          </div>
          <div className="p-3"><PageLoader message="" /></div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) return null;

  return (
    <section className={`mb-3 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">From the Blog</span>
          </div>
          <a href={BLOG_BASE} target="_blank" rel="noopener noreferrer"
            className="text-[10px] text-primary hover:opacity-80 flex items-center gap-1 transition-opacity font-semibold">
            View all <ChevronRight className="w-3 h-3" />
          </a>
        </div>

        {/* Posts */}
        <div className="p-3 space-y-2">
          {posts.map((post, idx) => (
            <motion.a key={post.id} href={`${BLOG_BASE}${post.url}`} target="_blank" rel="noopener noreferrer"
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="block p-4 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border hover:border-primary/30 transition-all group">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors mb-1">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground group-hover:text-primary/70 transition-colors">
                    <span className="font-semibold">Read article</span>
                    <ExternalLink className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-primary/5">
          <a href={BLOG_BASE} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 text-xs font-bold text-primary hover:opacity-80 transition-opacity">
            <Zap className="w-3 h-3" />
            Explore More Articles
            <ChevronRight className="w-3 h-3" />
          </a>
        </div>
      </motion.div>
    </section>
  );
}
