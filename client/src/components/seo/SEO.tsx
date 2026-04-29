import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  canonical?: string;
  noindex?: boolean;
  structuredData?: object | object[];
  keywords?: string;
}

const SITE_URL = 'https://open-interview.github.io';
  const DEFAULT_OG_IMAGE = 'https://open-interview.github.io/opengraph.webp';

// Default structured data for Organization
const organizationStructuredData = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Open-Interview",
  "url": SITE_URL,
  "logo": {
    "@type": "ImageObject",
    "url": `${SITE_URL}/favicon.svg`
  },
  "sameAs": [
    "https://github.com/open-interview",
    "https://twitter.com/openinterview"
  ],
  "description": "Free technical interview preparation platform with 1000+ questions across 30+ topics"
};

// Default structured data for WebSite
const websiteStructuredData = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Open-Interview",
  "url": SITE_URL,
  "potentialAction": {
    "@type": "SearchAction",
    "target": `${SITE_URL}/?search={search_term_string}`,
    "query-input": "required name=search_term_string"
  }
};

export function SEO({
  title,
  description,
  ogImage = DEFAULT_OG_IMAGE,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonical,
  noindex = false,
  structuredData,
  keywords,
}: SEOProps) {
  const fullTitle = title.includes('Open-Interview')
    ? title
    : `${title} | Open-Interview`;

  const canonicalUrl = canonical || `${SITE_URL}${typeof window !== 'undefined' ? window.location.pathname : ''}`;

  // Build structured data array
  const structuredDataArray = structuredData
    ? Array.isArray(structuredData) ? structuredData : [structuredData]
    : [organizationStructuredData, websiteStructuredData];

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content="Open-Interview" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:url" content={canonicalUrl} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={fullTitle} />
      <meta name="twitter:creator" content="@satishkumar_dev" />
      <meta name="twitter:site" content="@openinterview" />

      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Structured Data (JSON-LD) */}
      {structuredDataArray.map((data, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(data)}
        </script>
      ))}
    </Helmet>
  );
}
