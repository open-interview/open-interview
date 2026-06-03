/**
 * Test script for the unified SVG Integration
 * Run: node script/test-svg-integration.js
 */
import { generateBlogSVG, generateBlogBatchSVGs, detectScene } from './ai/utils/svg-integration.js';

const testPosts = [
  {
    title: 'Building Resilient Microservices Architecture on Kubernetes',
    content: 'System design for microservices with service mesh, circuit breakers, and auto-scaling patterns for production-grade deployments.',
    channel: 'kubernetes',
  },
  {
    title: 'How We Scaled PostgreSQL to 2.3M Queries Per Second',
    content: 'Database performance optimization with connection pooling, read replicas, query caching, and sharding strategies.',
    channel: 'database',
  },
  {
    title: 'Team Standup Rituals That Actually Work for Remote Teams',
    content: 'Collaboration tips for distributed engineering teams with async standups, sprint planning, and retrospective formats.',
    channel: 'team',
  },
  {
    title: 'Zero Trust Security: A Practical Implementation Guide',
    content: 'Security architecture with mTLS, OAuth 2.0, policy-based access control, and network segmentation for cloud-native apps.',
    channel: 'security',
  },
  {
    title: 'React Performance: From 3s to 200ms Load Time',
    content: 'Frontend optimization with code splitting, lazy loading, memo patterns, and bundle analysis for React SPAs.',
    channel: 'frontend',
  },
];

async function main() {
  console.log('=== SVG Integration Test ===\n');

  // Test 1: Scene detection
  console.log('--- Scene Detection ---');
  for (const post of testPosts) {
    const scene = detectScene(post.title, post.content);
    console.log(`  "${post.title.substring(0, 50)}..." -> ${scene}`);
  }

  // Test 2: Generate SVGs for each post
  console.log('\n--- Generating SVGs ---');
  for (const post of testPosts) {
    try {
      const scene = detectScene(post.title, post.content);
      const result = await generateBlogSVG(post.title, post.content, { preferred: 'd3' });
      console.log(`  ✓ [${result.generator}] ${post.channel}: ${result.filename}`);
    } catch (err) {
      console.log(`  ✗ ${post.channel}: ${err.message}`);
    }
  }

  // Test 3: Batch generation
  console.log('\n--- Batch Generation ---');
  const batchResults = await generateBlogBatchSVGs(testPosts, { preferred: 'd3' });
  for (const r of batchResults) {
    if (r.error) {
      console.log(`  ✗ ${r.slug || 'unknown'}: ${r.error}`);
    } else {
      console.log(`  ✓ [${r.generator}] ${r.filename} (scene: ${r.scene})`);
    }
  }

  console.log('\n=== SVG Integration Test Complete ===');
}

main().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
