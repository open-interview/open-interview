import { useEffect } from "react";

interface SEOProps {
  title?: string;
  description?: string;
  ogImage?: string;
  ogType?: "website" | "article";
  canonicalUrl?: string;
  publishedAt?: string;
}

const SITE_NAME = "OpenInterview Blog";
const DEFAULT_OG_IMAGE = "/opengraph.jpg";

function setMeta(name: string, content: string, property = false) {
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
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

export function useBlogSEO({ title, description, ogImage, ogType = "website", canonicalUrl, publishedAt }: SEOProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
    document.title = fullTitle;

    if (description) {
      setMeta("description", description);
      setMeta("og:description", description, true);
      setMeta("twitter:description", description);
    }

    setMeta("og:title", fullTitle, true);
    setMeta("og:type", ogType, true);
    setMeta("og:image", ogImage || DEFAULT_OG_IMAGE, true);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:image", ogImage || DEFAULT_OG_IMAGE);

    if (canonicalUrl) {
      setMeta("og:url", canonicalUrl, true);
      setLink("canonical", canonicalUrl);
    }

    if (publishedAt) {
      setMeta("article:published_time", publishedAt, true);
    }
  }, [title, description, ogImage, ogType, canonicalUrl, publishedAt]);
}
