import fs from 'fs';
import path from 'path';

const OUTPUT_DIR = 'client/public';
const BASE_URL = 'https://open-interview.github.io';

// All channels from channels-config.ts with SEO metadata
const channels = [
  // CS Fundamentals
  { id: 'data-structures', name: 'Data Structures', priority: '0.9' },
  { id: 'complexity-analysis', name: 'Complexity Analysis', priority: '0.8' },
  { id: 'dynamic-programming', name: 'Dynamic Programming', priority: '0.9' },
  { id: 'bit-manipulation', name: 'Bit Manipulation', priority: '0.7' },
  { id: 'design-patterns', name: 'Design Patterns', priority: '0.8' },
  { id: 'concurrency', name: 'Concurrency', priority: '0.8' },
  { id: 'math-logic', name: 'Math & Logic', priority: '0.7' },
  { id: 'low-level', name: 'Low-Level Programming', priority: '0.7' },
  
  // Engineering
  { id: 'system-design', name: 'System Design', priority: '0.9' },
  { id: 'algorithms', name: 'Algorithms', priority: '0.9' },
  { id: 'frontend', name: 'Frontend', priority: '0.9' },
  { id: 'backend', name: 'Backend', priority: '0.9' },
  { id: 'database', name: 'Database', priority: '0.8' },
  { id: 'devops', name: 'DevOps', priority: '0.8' },
  { id: 'sre', name: 'SRE', priority: '0.8' },
  { id: 'kubernetes', name: 'Kubernetes', priority: '0.8' },
  { id: 'aws', name: 'AWS', priority: '0.8' },
  { id: 'terraform', name: 'Terraform', priority: '0.7' },
  { id: 'data-engineering', name: 'Data Engineering', priority: '0.7' },
  { id: 'machine-learning', name: 'Machine Learning', priority: '0.8' },
  { id: 'generative-ai', name: 'Generative AI', priority: '0.9' },
  { id: 'prompt-engineering', name: 'Prompt Engineering', priority: '0.8' },
  { id: 'llm-ops', name: 'LLMOps', priority: '0.7' },
  { id: 'computer-vision', name: 'Computer Vision', priority: '0.7' },
  { id: 'nlp', name: 'NLP', priority: '0.7' },
  { id: 'python', name: 'Python', priority: '0.8' },
  { id: 'security', name: 'Security', priority: '0.8' },
  { id: 'networking', name: 'Networking', priority: '0.7' },
  { id: 'operating-systems', name: 'Operating Systems', priority: '0.7' },
  { id: 'linux', name: 'Linux', priority: '0.7' },
  { id: 'unix', name: 'Unix', priority: '0.6' },
  { id: 'ios', name: 'iOS', priority: '0.7' },
  { id: 'android', name: 'Android', priority: '0.7' },
  { id: 'react-native', name: 'React Native', priority: '0.7' },
  { id: 'testing', name: 'Testing', priority: '0.8' },
  { id: 'e2e-testing', name: 'E2E Testing', priority: '0.7' },
  { id: 'api-testing', name: 'API Testing', priority: '0.7' },
  { id: 'performance-testing', name: 'Performance Testing', priority: '0.7' },
  { id: 'engineering-management', name: 'Engineering Management', priority: '0.7' },
  { id: 'behavioral', name: 'Behavioral', priority: '0.8' }
];

// Certification channels
const certifications = [
  // AWS
  { id: 'aws-saa', name: 'AWS Solutions Architect Associate', priority: '0.8' },
  { id: 'aws-sap', name: 'AWS Solutions Architect Professional', priority: '0.8' },
  { id: 'aws-dva', name: 'AWS Developer Associate', priority: '0.8' },
  { id: 'aws-sysops', name: 'AWS SysOps Administrator', priority: '0.7' },
  { id: 'aws-devops-pro', name: 'AWS DevOps Engineer Professional', priority: '0.7' },
  { id: 'aws-data-engineer', name: 'AWS Data Engineer', priority: '0.7' },
  { id: 'aws-ml-specialty', name: 'AWS Machine Learning Specialty', priority: '0.7' },
  { id: 'aws-security-specialty', name: 'AWS Security Specialty', priority: '0.7' },
  { id: 'aws-ai-practitioner', name: 'AWS AI Practitioner', priority: '0.7' },
  
  // Kubernetes
  { id: 'cka', name: 'CKA - Kubernetes Administrator', priority: '0.8' },
  { id: 'ckad', name: 'CKAD - Kubernetes Developer', priority: '0.8' },
  { id: 'cks', name: 'CKS - Kubernetes Security', priority: '0.7' },
  
  // HashiCorp
  { id: 'terraform-associate', name: 'Terraform Associate', priority: '0.8' },
  { id: 'vault-associate', name: 'Vault Associate', priority: '0.7' },
  
  // GCP
  { id: 'gcp-cloud-engineer', name: 'GCP Cloud Engineer', priority: '0.7' },
  { id: 'gcp-cloud-architect', name: 'GCP Cloud Architect', priority: '0.7' },
  
  // Azure
  { id: 'azure-fundamentals', name: 'Azure Fundamentals', priority: '0.7' },
  { id: 'azure-administrator', name: 'Azure Administrator', priority: '0.7' },
  { id: 'azure-developer', name: 'Azure Developer', priority: '0.7' },
];

// Static pages with SEO metadata
const staticPages = [
  { path: '/', priority: '1.0', changefreq: 'daily', title: 'Home' },
  { path: '/channels', priority: '0.9', changefreq: 'daily', title: 'All Channels' },
  { path: '/certifications', priority: '0.9', changefreq: 'weekly', title: 'Certification Prep' },
  { path: '/coding', priority: '0.9', changefreq: 'weekly', title: 'Coding Challenges' },
  { path: '/tests', priority: '0.8', changefreq: 'weekly', title: 'Practice Tests' },
  { path: '/voice-interview', priority: '0.8', changefreq: 'weekly', title: 'Voice Interview Practice' },
  { path: '/review', priority: '0.8', changefreq: 'daily', title: 'Spaced Repetition Review' },
  { path: '/training', priority: '0.8', changefreq: 'weekly', title: 'Training Mode' },
  { path: '/badges', priority: '0.7', changefreq: 'weekly', title: 'Badges & Achievements' },
  { path: '/whats-new', priority: '0.8', changefreq: 'daily', title: 'What\'s New' },
  { path: '/about', priority: '0.6', changefreq: 'monthly', title: 'About' },
  { path: '/stats', priority: '0.7', changefreq: 'weekly', title: 'Statistics' },
  { path: '/documentation', priority: '0.6', changefreq: 'monthly', title: 'Documentation' },
  { path: '/bot-activity', priority: '0.6', changefreq: 'daily', title: 'Bot Activity' },
];

function generateSitemap() {
  const today = new Date().toISOString().split('T')[0];

  let urls = '';

  // Add static pages
  staticPages.forEach(page => {
    urls += `
  <url>
    <loc>${BASE_URL}${page.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  });

  // Add channel pages
  channels.forEach(channel => {
    urls += `
  <url>
    <loc>${BASE_URL}/channel/${channel.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>${channel.priority}</priority>
  </url>`;
  });

  // Add certification pages
  certifications.forEach(cert => {
    urls += `
  <url>
    <loc>${BASE_URL}/certification/${cert.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${cert.priority}</priority>
  </url>`;
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

// Generate robots.txt
function generateRobotsTxt() {
  return `# Code Reels - Technical Interview Prep
# https://open-interview.github.io

User-agent: *
Allow: /

# Sitemaps
Sitemap: ${BASE_URL}/sitemap.xml

# Allow all major search engine bots
User-agent: Googlebot
Allow: /

User-agent: Bingbot
Allow: /

User-agent: Slurp
Allow: /

User-agent: DuckDuckBot
Allow: /

# Disallow admin/internal paths (none currently)
# Disallow: /admin/
`;
}

function main() {
  console.log('=== 🔍 SEO Files Generator ===\n');

  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Generate and write sitemap
  const sitemap = generateSitemap();
  const sitemapPath = path.join(OUTPUT_DIR, 'sitemap.xml');
  fs.writeFileSync(sitemapPath, sitemap);
  console.log(`✅ Sitemap generated: ${sitemapPath}`);

  // Generate and write robots.txt
  const robotsTxt = generateRobotsTxt();
  const robotsPath = path.join(OUTPUT_DIR, 'robots.txt');
  fs.writeFileSync(robotsPath, robotsTxt);
  console.log(`✅ Robots.txt generated: ${robotsPath}`);

  console.log(`\n📊 Summary:`);
  console.log(`   Base URL: ${BASE_URL}`);
  console.log(`   Static pages: ${staticPages.length}`);
  console.log(`   Channel pages: ${channels.length}`);
  console.log(`   Certification pages: ${certifications.length}`);
  console.log(`   Total URLs: ${staticPages.length + channels.length + certifications.length}`);
}

main();
