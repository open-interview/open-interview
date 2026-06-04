/**
 * Recent Blog Posts Component
 */

import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { FileText, ChevronRight, Sparkles, Zap } from 'lucide-react';
import { getPosts } from '../lib/blog-loader';

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
}

interface RecentBlogPostsProps {
  limit?: number;
  className?: string;
}

export function RecentBlogPosts({ limit = 3, className = '' }: RecentBlogPostsProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    getPosts({ limit, page: 1 })
      .then(({ data: allPosts }) => {
        const mapped = allPosts
          .map((p: any) => ({ id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt }));
        setPosts(mapped);
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, [limit]);

  if (isLoading) {
    return (
      <section className={`mb-3 ${className}`}>
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border">
            <h2 className="text-lg font-bold flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />From the Blog</h2>
          </div>
          <div className="p-3 flex justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) return null;

  return (
    <section className={`mb-3 ${className}`}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">From the Blog</span>
          </div>
          <button
            onClick={() => setLocation('/blog')}
            className="text-[10px] text-primary hover:opacity-80 flex items-center gap-1 transition-opacity font-semibold cursor-pointer"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="p-3 space-y-2">
          {posts.map((post, idx) => (
            <motion.button
              key={post.id}
              onClick={() => setLocation(`/blog/${post.slug}`)}
              initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full text-left block p-4 rounded-xl bg-muted/30 hover:bg-muted/60 border border-border hover:border-primary/30 transition-all group cursor-pointer"
            >
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
                    <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>

        <div className="px-4 py-3 border-t border-border bg-primary/5">
          <button
            onClick={() => setLocation('/blog')}
            className="w-full flex items-center justify-center gap-2 text-xs font-bold text-primary hover:opacity-80 transition-opacity cursor-pointer"
          >
            <Zap className="w-3 h-3" />
            Explore More Articles
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </motion.div>
    </section>
  );
}
