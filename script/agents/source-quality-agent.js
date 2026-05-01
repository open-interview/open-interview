/**
 * Source Quality Agent
 * Filters and ranks sources by authority, freshness, and relevance
 */

const AUTHORITY_DOMAINS = {
  tier1: ['github.com', 'arxiv.org', 'acm.org', 'ieee.org', 'ietf.org'],
  tier2: ['aws.amazon.com', 'cloud.google.com', 'azure.microsoft.com', 'kubernetes.io', 'docker.com', 'terraform.io'],
  tier3: ['wikipedia.org', 'stackoverflow.com', 'medium.com', 'dev.to'],
  tier4: [] // everything else
};

function getDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

function getAuthorityTier(url) {
  const domain = getDomain(url);
  for (const [tier, domains] of Object.entries(AUTHORITY_DOMAINS)) {
    if (domains.some(d => domain.includes(d))) {
      return tier;
    }
  }
  return 'tier4';
}

function scoreSource(source) {
  let score = 0;
  
  // Authority (40 points)
  const tier = getAuthorityTier(source.url);
  if (tier === 'tier1') score += 40;
  else if (tier === 'tier2') score += 30;
  else if (tier === 'tier3') score += 20;
  else score += 10;
  
  // Has title (20 points)
  if (source.title && source.title.length > 10) score += 20;
  
  // URL structure (20 points)
  if (source.url.includes('/docs/') || source.url.includes('/documentation/')) score += 20;
  else if (source.url.includes('/blog/') || source.url.includes('/article/')) score += 10;
  
  // HTTPS (10 points)
  if (source.url.startsWith('https://')) score += 10;
  
  // Not a generic homepage (10 points)
  const path = source.url.split('/').slice(3).join('/');
  if (path.length > 5) score += 10;
  
  return score;
}

export async function filterSources(sources, minScore = 50) {
  const scored = sources.map(source => ({
    ...source,
    qualityScore: scoreSource(source),
    tier: getAuthorityTier(source.url)
  }));
  
  // Sort by score descending
  scored.sort((a, b) => b.qualityScore - a.qualityScore);
  
  // Filter by minimum score
  const filtered = scored.filter(s => s.qualityScore >= minScore);
  
  return {
    filtered,
    removed: sources.length - filtered.length,
    avgScore: filtered.length > 0 
      ? Math.round(filtered.reduce((sum, s) => sum + s.qualityScore, 0) / filtered.length)
      : 0
  };
}

export default { filterSources };
