import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  FileCode,
  Cpu,
  Globe,
  Server,
  Cloud,
  Brain,
  Database,
  Shield,
  TestTube,
  Container,
  Code,
  Sparkles,
  ImageIcon,
} from "lucide-react";

const categoryGradients: Record<string, string> = {
  "system-design": "from-violet-600 to-indigo-600",
  algorithms: "from-cyan-600 to-blue-600",
  frontend: "from-pink-600 to-rose-600",
  backend: "from-emerald-600 to-teal-600",
  devops: "from-orange-600 to-amber-600",
  "ai-ml": "from-purple-600 to-violet-600",
  database: "from-sky-600 to-cyan-600",
  security: "from-red-600 to-rose-600",
  testing: "from-lime-600 to-green-600",
  kubernetes: "from-blue-600 to-indigo-600",
  aws: "from-yellow-600 to-orange-600",
  react: "from-cyan-600 to-sky-600",
  javascript: "from-yellow-600 to-amber-600",
  python: "from-blue-600 to-violet-600",
};

const categoryIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "system-design": FileCode,
  algorithms: Cpu,
  frontend: Globe,
  backend: Server,
  devops: Cloud,
  "ai-ml": Brain,
  database: Database,
  security: Shield,
  testing: TestTube,
  kubernetes: Container,
  aws: Cloud,
  react: Code,
  javascript: Code,
  python: Sparkles,
};

function getCategoryGradient(category: string): string {
  const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return categoryGradients[slug] || "from-violet-600 to-cyan-600";
}

function getCategoryIcon(category: string): React.ComponentType<{ className?: string }> {
  const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return categoryIcons[slug] || ImageIcon;
}

export interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  category?: string;
  fallback?: React.ReactNode;
}

export function ImageWithFallback({ src, alt, className, category, fallback }: ImageWithFallbackProps) {
  const [status, setStatus] = useState<"loading" | "loaded" | "error">("loading");

  useEffect(() => {
    const img = new Image();
    img.src = src;
    img.onload = () => setStatus("loaded");
    img.onerror = () => setStatus("error");
    if (img.complete && img.naturalWidth > 0) {
      setStatus("loaded");
    } else if (img.complete && img.naturalWidth === 0) {
      setStatus("error");
    }
  }, [src]);

  if (status === "error") {
    if (fallback) {
      return (
        <div role="img" aria-label={alt} className={cn("flex items-center justify-center", className)}>
          {fallback}
        </div>
      );
    }

    const gradient = category ? getCategoryGradient(category) : "from-violet-600 to-cyan-600";
    const IconComponent = category ? getCategoryIcon(category) : ImageIcon;

    return (
      <div
        role="img"
        aria-label={alt}
        className={cn("relative flex items-center justify-center bg-gradient-to-br", gradient, className)}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
        <IconComponent className="relative z-10 h-12 w-12 text-white/30" />
        {category && (
          <span className="absolute bottom-3 left-3 z-10 text-xs font-medium text-white/50">{category}</span>
        )}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={cn(
        "h-full w-full object-cover transition-opacity duration-300",
        status === "loading" ? "opacity-0" : "opacity-100",
        className,
      )}
      loading="lazy"
      decoding="async"
      aria-label={alt}
    />
  );
}
