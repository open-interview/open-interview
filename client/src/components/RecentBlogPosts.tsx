/**
 * Recent Blog Posts Component
 * Displays tiles linking to recent blog posts on the home page
 */

import { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { FileText, ExternalLink, ChevronRight, Sparkles } from 'lucide-react';

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

export function RecentBlogPosts({ limit = 3, className = '' }: RecentBlogPostsProps) {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const allPosts = await api.blog.getAll();
        // Convert to array and take most recent posts
        const postsArray = Object.entries(allPosts).map(([id, info]) => ({
          id,
          ...info,
        }));
        
        // Sort by ID (newer posts have higher timestamps in ID) and take limit
        const recentPosts = postsArray
          .sort((a, b) => {
            // Extract timestamp from blog IDs like "blog-1767709186611-mflfq9"
            const getTimestamp = (id: string) => {
              const match = id.match(/blog-(\d+)/);
              return match ? parseInt(match[1], 10) : 0;
            };
            return getTimestamp(b.id) - getTimestamp(a.id);
          })
          .slice(0, limit);
        
        setPosts(recentPosts);
      } catch (error) {
        console.error('Failed to load blog posts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPosts();
  }, [limit]);

  if (isLoading) {
    return (
      <section className={`mb-3 ${className}`}>
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="px-3 py-2 border-b border-border/50">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-muted-foreground">Recent Articles</span>
            </div>
          </div>
          <div className="p-3 space-y-2">
            {[...Array(limit)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-muted/30 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (posts.length === 0) {
    return null;
  }

  // Blog base URL - dedicated blog site
  const blogBaseUrl = 'https://openstackdaily.github.io';

  return (
    <section className={`mb-3 ${className}`}>
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {/* Header */}
        <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              From the Blog
            </span>
          </div>
          <a
            href={blogBaseUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-primary hover:underline flex items-center gap-1"
          >
            View all <ChevronRight className="w-3 h-3" />
          </a>
        </div>

        {/* Blog Post Tiles */}
        <div className="p-2 space-y-1.5">
          {posts.map((post) => (
            <a
              key={post.id}
              href={`${blogBaseUrl}${post.url}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block p-3 rounded-lg bg-muted/20 hover:bg-muted/40 border border-transparent hover:border-primary/20 transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-violet-500/20 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-primary transition-colors">
                    {post.title}
                  </h4>
                  <div className="flex items-center gap-1 mt-1 text-[10px] text-muted-foreground">
                    <span>Read article</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
