import { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { FileText, ExternalLink, Clock, Share2, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";
import { SEOHead } from "../../components/SEOHead";
import { AppLayout } from "../../components/layout/AppLayout";
import { cn } from "../../lib/utils";

interface BlogPostRow {
  id: string;
  title: string;
  slug: string;
  channel: string | null;
  status: string | null;
  linkedinSharedAt: string | null;
  publishedAt: string | null;
  createdAt: string;
}

function formatTimeAgo(dateStr: string): string {
  if (!dateStr) return "never";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

export default function AdminBlogPage() {
  const [, setLocation] = useLocation();
  const [posts, setPosts] = useState<BlogPostRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState(false);
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setFetchError(false);
      const res = await fetch("/api/admin/blog");
      if (res.ok) {
        const data = await res.json();
        setPosts(data);
      } else {
        setFetchError(true);
      }
    } catch (error) {
      console.error("Failed to fetch blog posts:", error);
      setFetchError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleSyncLinkedin = async (postId: string) => {
    setUpdateMessage(null);
    setUpdateError(null);
    try {
      const res = await fetch(`/api/admin/blog/${postId}/linkedin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sharedAt: new Date().toISOString(),
        }),
      });
      if (res.ok) {
        setUpdateMessage("LinkedIn timestamp updated");
        fetchData();
      } else {
        const body = await res.json();
        setUpdateError(body.error || "Failed to update");
      }
    } catch (error) {
      setUpdateError("Network error");
    }
    setTimeout(() => {
      setUpdateMessage(null);
      setUpdateError(null);
    }, 3000);
  };

  const totalPosts = posts.length;
  const publishedPosts = posts.filter((p) => p.status === "published").length;
  const linkedinShared = posts.filter((p) => p.linkedinSharedAt).length;

  return (
    <>
      <SEOHead
        title="Blog Admin - Manage Posts"
        description="Admin dashboard for managing blog posts and LinkedIn sharing."
      />
      <AppLayout title="Blog Admin" showBackOnMobile fullWidth>
        <div className="max-w-5xl mx-auto pb-24">
          <header className="hidden lg:flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Blog Posts
            </h1>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-muted transition-colors cursor-pointer min-h-[44px]"
            >
              <RefreshCw className={cn("w-4 h-4", refreshing && "animate-spin")} />
              Refresh
            </button>
          </header>

          {/* Mobile header */}
          <header className="lg:hidden mb-4">
            <h1 className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              Blog Posts
            </h1>
          </header>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-2xl font-bold">{totalPosts}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-2xl font-bold">{publishedPosts}</p>
              <p className="text-xs text-muted-foreground">Published</p>
            </div>
            <div className="bg-card border border-border rounded-lg p-4">
              <p className="text-2xl font-bold">{linkedinShared}</p>
              <p className="text-xs text-muted-foreground">Shared on LinkedIn</p>
            </div>
          </div>

          {/* Update feedback */}
          {updateMessage && (
            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg text-sm flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              {updateMessage}
            </div>
          )}
          {updateError && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              {updateError}
            </div>
          )}

          {/* Posts table */}
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Loading posts...
            </div>
          ) : fetchError ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-2 text-red-500" />
              <p>Failed to load blog posts</p>
              <button
                onClick={handleRefresh}
                className="mt-2 text-sm text-primary hover:underline cursor-pointer min-h-[44px]"
              >
                Try again
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <FileText className="w-8 h-8 mb-2" />
              <p>No blog posts found</p>
            </div>
          ) : (
            <div className="border border-border rounded-lg overflow-hidden">
              {/* Desktop table */}
              <table className="hidden lg:table w-full">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Title
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Channel
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Published
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      LinkedIn
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post) => (
                    <tr
                      key={post.id}
                      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setLocation(`/blog/${post.slug}`)}
                          className="text-sm font-medium text-primary hover:underline text-left cursor-pointer min-h-[44px]"
                        >
                          {post.title}
                        </button>
                        <p className="text-xs text-muted-foreground font-mono truncate max-w-[300px]">
                          {post.slug}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm">{post.channel || "-"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
                            post.status === "published"
                              ? "bg-green-500/10 text-green-600"
                              : "bg-yellow-500/10 text-yellow-600"
                          )}
                        >
                          {post.status || "draft"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-muted-foreground">
                          {post.publishedAt ? formatTimeAgo(post.publishedAt) : "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {post.linkedinSharedAt ? (
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {formatTimeAgo(post.linkedinSharedAt)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">Not shared</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setLocation(`/blog/${post.slug}`)}
                            className="p-1.5 rounded hover:bg-muted transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="View post"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleSyncLinkedin(post.id)}
                            className="p-1.5 rounded hover:bg-muted transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
                            title="Mark as shared on LinkedIn"
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Mobile cards */}
              <div className="lg:hidden divide-y divide-border">
                {posts.map((post) => (
                  <div key={post.id} className="p-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <button
                        onClick={() => setLocation(`/blog/${post.slug}`)}
                        className="text-sm font-medium text-primary hover:underline text-left cursor-pointer min-h-[44px]"
                      >
                        {post.title}
                      </button>
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium shrink-0",
                          post.status === "published"
                            ? "bg-green-500/10 text-green-600"
                            : "bg-yellow-500/10 text-yellow-600"
                        )}
                      >
                        {post.status || "draft"}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-3">
                      <div>
                        <span className="block text-muted-foreground/60">Channel</span>
                        {post.channel || "-"}
                      </div>
                      <div>
                        <span className="block text-muted-foreground/60">Published</span>
                        {post.publishedAt ? formatTimeAgo(post.publishedAt) : "-"}
                      </div>
                      <div className="col-span-2">
                        <span className="block text-muted-foreground/60">LinkedIn</span>
                        {post.linkedinSharedAt ? (
                          <span className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3 text-green-500" />
                            {formatTimeAgo(post.linkedinSharedAt)}
                          </span>
                        ) : (
                          "Not shared"
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setLocation(`/blog/${post.slug}`)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border hover:bg-muted transition-colors cursor-pointer min-h-[44px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View
                      </button>
                      <button
                        onClick={() => handleSyncLinkedin(post.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs rounded border border-border hover:bg-muted transition-colors cursor-pointer min-h-[44px]"
                      >
                        <Share2 className="w-3 h-3" />
                        Mark shared
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </AppLayout>
    </>
  );
}
