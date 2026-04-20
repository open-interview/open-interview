#!/usr/bin/env node
/**
 * Test LinkedIn Post Generation Flow
 * Tests the complete pipeline including image generation
 * 
 * Run: node script/test-linkedin-post-flow.js
 */

import { generateLinkedInPost } from './ai/graphs/linkedin-graph.js';

// Test post data - using a real blog URL from the project
const testPosts = [
  {
    postId: 'test-1',
    title: 'Multi-Cloud Kubernetes: Build Resilient Clusters Across Clouds',
    url: 'https://openstackdaily.github.io/posts/blog-1767709186611-mflfq9/multi-cloud-kubernetes-build-resilient-clusters-across-clouds/',
    excerpt: 'Learn how to build resilient Kubernetes clusters that span multiple cloud providers for maximum availability and disaster recovery.',
    channel: 'kubernetes',
    tags: '#Kubernetes #MultiCloud #DevOps #CloudNative #SRE #Infrastructure'
  },
  {
    postId: 'test-2', 
    title: 'Database Sharding Strategies for High-Scale Applications',
    url: 'https://openstackdaily.github.io/posts/q-553/the-mysterious-case-of-the-oom-killer-how-to-diagnose-a-production-outage-you-ca/',
    excerpt: 'Deep dive into database sharding patterns, when to use them, and how to implement them correctly.',
    channel: 'database',
    tags: '#Database #Sharding #SystemDesign #Backend #Scalability'
  }
];

async function runTest() {
  console.log('🧪 LinkedIn Post Flow Test\n');
  console.log('Testing the complete pipeline:');
  console.log('  validate_url → generate_image → generate_story → quality_checks → build_post\n');
  
  // Skip AI for faster testing
  process.env.SKIP_AI = 'true';
  
  for (const post of testPosts) {
    console.log('\n' + '═'.repeat(70));
    console.log(`📝 Testing: ${post.title.substring(0, 50)}...`);
    console.log('═'.repeat(70));
    
    try {
      const result = await generateLinkedInPost(post);
      
      if (result.success) {
        console.log('\n✅ POST GENERATED SUCCESSFULLY\n');
        console.log('─'.repeat(50));
        console.log('CONTENT PREVIEW:');
        console.log('─'.repeat(50));
        console.log(result.content.substring(0, 500) + '...\n');
        
        if (result.image) {
          console.log('─'.repeat(50));
          console.log('IMAGE INFO:');
          console.log('─'.repeat(50));
          console.log(`  Path: ${result.image.path}`);
          console.log(`  Valid: ${result.image.valid}`);
          console.log(`  Scene: ${result.image.scene}`);
        }
        
        if (result.qualityIssues?.length > 0) {
          console.log('\n⚠️  Quality Issues:', result.qualityIssues.join(', '));
        }
      } else {
        console.log('\n❌ POST GENERATION FAILED');
        console.log(`   Error: ${result.error}`);
      }
    } catch (error) {
      console.error('\n❌ EXCEPTION:', error.message);
    }
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('🏁 Test Complete');
  console.log('═'.repeat(70));
}

runTest().catch(console.error);
