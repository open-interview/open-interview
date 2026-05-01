import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  canonicalUrl?: string;
  publishedAt?: string;
  author?: string;
  tags?: string[];
}

export interface BlogPostingStructuredData {
  "@context": "https://schema.org";
  "@type": "BlogPosting";
  headline: string;
  description: string;
  image?: string;
  datePublished?: string;
  author: { "@type": "Person"; name: string };
  publisher: { "@type": "Organization"; name: string };
  url?: string;
  keywords?: string;
}

const SITE_NAME = "OpenInterview Blog";
const DEFAULT_OG_IMAGE = "/opengraph.jpg";

function truncate(text: string, max: number) {
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd() + "…";
}

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
  return el;
}

function resetMeta(name: string, property = false) {
  const attr = property ? "property" : "name";
  const el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (el) {
    el.content = "";
  }
}

function setLink(rel: string, href: string) {
  let el = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
}

export function useBlogSEO({ title, description, ogImage, ogType = "website", canonicalUrl, publishedAt, author, tags }: SEOProps) {
  const metaDescription = description ? truncate(description, 155) : undefined;
  const keywords = tags?.length ? tags.join(", ") : undefined;

  const structuredData: BlogPostingStructuredData | null =
    ogType === "article" && title
      ? {
          "@context": "https://schema.org",
          "@type": "BlogPosting",
          headline: title,
          description: metaDescription ?? "",
          ...(ogImage ? { image: ogImage } : {}),
          ...(publishedAt ? { datePublished: publishedAt } : {}),
          author: { "@type": "Person", name: author ?? "OpenInterview" },
          publisher: { "@type": "Organization", name: SITE_NAME },
          ...(canonicalUrl ? { url: canonicalUrl } : {}),
          ...(keywords ? { keywords } : {}),
        }
      : null;

  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    if (metaDescription) {
      setMeta("description", metaDescription);
      setMeta("og:description", metaDescription, true);
      setMeta("twitter:description", metaDescription);
    }

    if (keywords) setMeta("keywords", keywords);

    setMeta("og:title", fullTitle, true);
    setMeta("og:type", ogType, true);
    setMeta("og:image", ogImage ?? DEFAULT_OG_IMAGE, true);
    setMeta("og:image:width", "1200", true);
    setMeta("og:image:height", "630", true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:image", ogImage ?? DEFAULT_OG_IMAGE);

    if (canonicalUrl) {
      setMeta("og:url", canonicalUrl, true);
      setLink("canonical", canonicalUrl);
    }

    if (publishedAt) setMeta("article:published_time", publishedAt, true);
    if (author) setMeta("article:author", author, true);

    // JSON-LD structured data
    const id = "blog-jsonld";
    let script = document.getElementById(id) as HTMLScriptElement | null;
    if (structuredData) {
      if (!script) {
        script = document.createElement("script");
        script.id = id;
        script.type = "application/ld+json";
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

    return () => {
      document.title = SITE_NAME;
      resetMeta("description");
      resetMeta("og:description", true);
      resetMeta("twitter:description");
      resetMeta("og:title", true);
      resetMeta("og:type", true);
      resetMeta("og:image", true);
      resetMeta("twitter:card");
      resetMeta("twitter:title");
      resetMeta("twitter:image");
      resetMeta("og:url", true);
      const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (canonical) canonical.href = "";
      resetMeta("article:published_time", true);
      resetMeta("article:author", true);
      document.getElementById(id)?.remove();
    };
  }, [title, metaDescription, keywords, ogImage, ogType, canonicalUrl, publishedAt, author, structuredData]);

  return { structuredData };
}
