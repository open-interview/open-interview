#!/usr/bin/env node
/**
 * Citation-First Blog Generator
 * 
 * Approach:
 * 1. Pick a topic with pre-curated source URLs
 * 2. Validate each URL (not 404)
 * 3. Fetch and extract content from valid URLs
 * 4. Generate blog post from REAL downloaded content
 */

import 'dotenv/config';
import { createClient } from '@libsql/client';
import fs from 'fs';
import { generateCitationBlog } from './ai/graphs/citation-blog-graph.js';

const OUTPUT_DIR = 'blog-output';
const MIN_VALID_SOURCES = 8;

// Topics with curated source URLs - real, high-quality sources
const TOPICS_WITH_SOURCES = [
  {
    topic: 'Kubernetes deployment strategies',
    urls: [
      { url: 'https://kubernetes.io/docs/concepts/workloads/controllers/deployment/', title: 'Kubernetes Deployments Documentation' },
      { url: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/update/update-intro/', title: 'Kubernetes Rolling Updates' },
      { url: 'https://www.weave.works/blog/kubernetes-deployment-strategies', title: 'Kubernetes Deployment Strategies - Weaveworks' },
      { url: 'https://blog.container-solutions.com/kubernetes-deployment-strategies', title: 'Kubernetes Deployment Strategies - Container Solutions' },
      { url: 'https://docs.aws.amazon.com/eks/latest/best-practices/deployment.html', title: 'AWS EKS Deployment Best Practices' },
      { url: 'https://cloud.google.com/kubernetes-engine/docs/concepts/deployment', title: 'GKE Deployment Concepts' },
      { url: 'https://www.redhat.com/en/topics/containers/what-is-kubernetes-deployment', title: 'Red Hat - What is Kubernetes Deployment' },
      { url: 'https://codefresh.io/learn/kubernetes-deployment/', title: 'Codefresh - Kubernetes Deployment Guide' },
      { url: 'https://semaphoreci.com/blog/kubernetes-deployment', title: 'Semaphore - Kubernetes Deployment Tutorial' },
      { url: 'https://www.digitalocean.com/community/tutorials/how-to-set-up-blue-green-deployments-on-digitalocean-kubernetes', title: 'DigitalOcean - Blue-Green Deployments' },
      { url: 'https://argo-cd.readthedocs.io/en/stable/', title: 'Argo CD Documentation' },
      { url: 'https://fluxcd.io/docs/', title: 'Flux CD Documentation' }
    ]
  },
  {
    topic: 'Database indexing and query optimization',
    urls: [
      { url: 'https://use-the-index-luke.com/', title: 'Use The Index, Luke - SQL Indexing Guide' },
      { url: 'https://www.postgresql.org/docs/current/indexes.html', title: 'PostgreSQL Indexes Documentation' },
      { url: 'https://dev.mysql.com/doc/refman/8.0/en/optimization-indexes.html', title: 'MySQL Index Optimization' },
      { url: 'https://docs.mongodb.com/manual/indexes/', title: 'MongoDB Indexes Documentation' },
      { url: 'https://www.percona.com/blog/mysql-indexing-best-practices/', title: 'Percona - MySQL Indexing Best Practices' },
      { url: 'https://planetscale.com/blog/how-read-mysql-explains', title: 'PlanetScale - Reading MySQL EXPLAIN' },
      { url: 'https://www.cockroachlabs.com/docs/stable/indexes.html', title: 'CockroachDB Indexes' },
      { url: 'https://www.timescale.com/blog/postgresql-query-optimization/', title: 'Timescale - PostgreSQL Query Optimization' },
      { url: 'https://aws.amazon.com/blogs/database/best-practices-for-amazon-rds-postgresql-query-optimization/', title: 'AWS RDS PostgreSQL Optimization' },
      { url: 'https://docs.microsoft.com/en-us/sql/relational-databases/indexes/indexes', title: 'SQL Server Indexes Documentation' },
      { url: 'https://www.citusdata.com/blog/2017/10/17/tour-of-postgres-index-types/', title: 'Citus - Tour of Postgres Index Types' }
    ]
  },
  {
    topic: 'Microservices communication patterns',
    urls: [
      { url: 'https://microservices.io/patterns/communication-style/', title: 'Microservices.io - Communication Patterns' },
      { url: 'https://docs.microsoft.com/en-us/azure/architecture/microservices/design/interservice-communication', title: 'Azure - Microservices Communication' },
      { url: 'https://aws.amazon.com/blogs/compute/building-well-architected-serverless-applications-building-in-resiliency-part-1/', title: 'AWS - Building Resilient Microservices' },
      { url: 'https://grpc.io/docs/what-is-grpc/introduction/', title: 'gRPC Introduction' },
      { url: 'https://www.rabbitmq.com/tutorials/tutorial-one-python.html', title: 'RabbitMQ Tutorial' },
      { url: 'https://kafka.apache.org/documentation/', title: 'Apache Kafka Documentation' },
      { url: 'https://docs.nats.io/', title: 'NATS Documentation' },
      { url: 'https://www.nginx.com/blog/building-microservices-inter-process-communication/', title: 'NGINX - Microservices IPC' },
      { url: 'https://martinfowler.com/articles/microservices.html', title: 'Martin Fowler - Microservices' },
      { url: 'https://netflixtechblog.com/optimizing-the-netflix-api-5c9ac715cf19', title: 'Netflix Tech Blog - API Optimization' },
      { url: 'https://engineering.linkedin.com/blog/2016/06/building-the-linkedin-feed--behind-the-scenes', title: 'LinkedIn Engineering - Feed Architecture' }
    ]
  },
  {
    topic: 'Observability and distributed tracing',
    urls: [
      { url: 'https://opentelemetry.io/docs/', title: 'OpenTelemetry Documentation' },
      { url: 'https://www.jaegertracing.io/docs/', title: 'Jaeger Tracing Documentation' },
      { url: 'https://zipkin.io/', title: 'Zipkin Distributed Tracing' },
      { url: 'https://grafana.com/docs/tempo/latest/', title: 'Grafana Tempo Documentation' },
      { url: 'https://docs.datadoghq.com/tracing/', title: 'Datadog APM Documentation' },
      { url: 'https://www.honeycomb.io/blog/observability-101-terminology-and-concepts', title: 'Honeycomb - Observability 101' },
      { url: 'https://lightstep.com/blog/three-pillars-of-observability', title: 'Lightstep - Three Pillars of Observability' },
      { url: 'https://newrelic.com/blog/best-practices/what-is-distributed-tracing', title: 'New Relic - Distributed Tracing' },
      { url: 'https://aws.amazon.com/xray/', title: 'AWS X-Ray' },
      { url: 'https://cloud.google.com/trace/docs', title: 'Google Cloud Trace' },
      { url: 'https://prometheus.io/docs/introduction/overview/', title: 'Prometheus Documentation' }
    ]
  },
  {
    topic: 'API rate limiting and throttling',
    urls: [
      { url: 'https://cloud.google.com/architecture/rate-limiting-strategies-techniques', title: 'Google Cloud - Rate Limiting Strategies' },
      { url: 'https://docs.aws.amazon.com/apigateway/latest/developerguide/api-gateway-request-throttling.html', title: 'AWS API Gateway Throttling' },
      { url: 'https://stripe.com/docs/rate-limits', title: 'Stripe Rate Limits' },
      { url: 'https://developer.twitter.com/en/docs/twitter-api/rate-limits', title: 'Twitter API Rate Limits' },
      { url: 'https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting', title: 'GitHub API Rate Limiting' },
      { url: 'https://redis.io/commands/incr/', title: 'Redis INCR - Rate Limiting' },
      { url: 'https://blog.cloudflare.com/counting-things-a-lot-of-different-things/', title: 'Cloudflare - Rate Limiting at Scale' },
      { url: 'https://konghq.com/blog/how-to-design-a-scalable-rate-limiting-algorithm', title: 'Kong - Rate Limiting Algorithm Design' },
      { url: 'https://www.nginx.com/blog/rate-limiting-nginx/', title: 'NGINX Rate Limiting' },
      { url: 'https://engineering.shopify.com/blogs/engineering/rate-limiting-graphql-apis-calculating-query-complexity', title: 'Shopify - GraphQL Rate Limiting' }
    ]
  },
  {
    topic: 'Circuit breaker pattern implementation',
    urls: [
      { url: 'https://martinfowler.com/bliki/CircuitBreaker.html', title: 'Martin Fowler - Circuit Breaker' },
      { url: 'https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker', title: 'Azure - Circuit Breaker Pattern' },
      { url: 'https://resilience4j.readme.io/docs/circuitbreaker', title: 'Resilience4j Circuit Breaker' },
      { url: 'https://github.com/Netflix/Hystrix/wiki', title: 'Netflix Hystrix Wiki' },
      { url: 'https://docs.aws.amazon.com/prescriptive-guidance/latest/cloud-design-patterns/circuit-breaker.html', title: 'AWS - Circuit Breaker Pattern' },
      { url: 'https://www.baeldung.com/resilience4j', title: 'Baeldung - Resilience4j Guide' },
      { url: 'https://istio.io/latest/docs/tasks/traffic-management/circuit-breaking/', title: 'Istio Circuit Breaking' },
      { url: 'https://docs.spring.io/spring-cloud-circuitbreaker/docs/current/reference/html/', title: 'Spring Cloud Circuit Breaker' },
      { url: 'https://www.nginx.com/blog/microservices-reference-architecture-nginx-circuit-breaker-pattern/', title: 'NGINX - Circuit Breaker Pattern' },
      { url: 'https://engineering.grab.com/designing-resilient-systems-part-1', title: 'Grab Engineering - Resilient Systems' }
    ]
  },
  {
    topic: 'Event-driven architecture patterns',
    urls: [
      { url: 'https://martinfowler.com/articles/201701-event-driven.html', title: 'Martin Fowler - Event-Driven Architecture' },
      { url: 'https://docs.microsoft.com/en-us/azure/architecture/guide/architecture-styles/event-driven', title: 'Azure - Event-Driven Architecture' },
      { url: 'https://aws.amazon.com/event-driven-architecture/', title: 'AWS Event-Driven Architecture' },
      { url: 'https://kafka.apache.org/documentation/streams/', title: 'Kafka Streams Documentation' },
      { url: 'https://www.confluent.io/blog/event-driven-microservices-with-apache-kafka/', title: 'Confluent - Event-Driven Microservices' },
      { url: 'https://docs.aws.amazon.com/eventbridge/latest/userguide/what-is-amazon-eventbridge.html', title: 'AWS EventBridge' },
      { url: 'https://cloud.google.com/eventarc/docs', title: 'Google Cloud Eventarc' },
      { url: 'https://www.rabbitmq.com/tutorials/tutorial-five-python.html', title: 'RabbitMQ Topics Tutorial' },
      { url: 'https://microservices.io/patterns/data/event-sourcing.html', title: 'Microservices.io - Event Sourcing' },
      { url: 'https://netflixtechblog.com/evolution-of-the-netflix-data-pipeline-da246ca36905', title: 'Netflix - Data Pipeline Evolution' }
    ]
  },
  {
    topic: 'Container security best practices',
    urls: [
      { url: 'https://kubernetes.io/docs/concepts/security/', title: 'Kubernetes Security Documentation' },
      { url: 'https://docs.docker.com/engine/security/', title: 'Docker Security Documentation' },
      { url: 'https://snyk.io/learn/container-security/', title: 'Snyk - Container Security Guide' },
      { url: 'https://www.aquasec.com/cloud-native-academy/container-security/', title: 'Aqua - Container Security' },
      { url: 'https://sysdig.com/learn-cloud-native/container-security/', title: 'Sysdig - Container Security' },
      { url: 'https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/security.html', title: 'AWS ECS Security Best Practices' },
      { url: 'https://cloud.google.com/kubernetes-engine/docs/concepts/security-overview', title: 'GKE Security Overview' },
      { url: 'https://www.redhat.com/en/topics/security/container-security', title: 'Red Hat - Container Security' },
      { url: 'https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html', title: 'OWASP Docker Security Cheat Sheet' },
      { url: 'https://www.cisecurity.org/benchmark/docker', title: 'CIS Docker Benchmark' }
    ]
  },
  {
    topic: 'Caching strategies and patterns',
    urls: [
      { url: 'https://redis.io/docs/manual/patterns/', title: 'Redis Patterns' },
      { url: 'https://docs.aws.amazon.com/AmazonElastiCache/latest/mem-ug/Strategies.html', title: 'AWS ElastiCache Caching Strategies' },
      { url: 'https://docs.microsoft.com/en-us/azure/architecture/best-practices/caching', title: 'Azure Caching Best Practices' },
      { url: 'https://cloud.google.com/memorystore/docs/redis/caching-best-practices', title: 'Google Cloud Caching Best Practices' },
      { url: 'https://www.cloudflare.com/learning/cdn/what-is-caching/', title: 'Cloudflare - What is Caching' },
      { url: 'https://martinfowler.com/bliki/TwoHardThings.html', title: 'Martin Fowler - Cache Invalidation' },
      { url: 'https://engineering.fb.com/2013/06/25/core-data/scaling-memcache-at-facebook/', title: 'Facebook - Scaling Memcache' },
      { url: 'https://netflixtechblog.com/caching-for-a-global-netflix-7bcc457012f1', title: 'Netflix - Global Caching' },
      { url: 'https://www.nginx.com/blog/nginx-caching-guide/', title: 'NGINX Caching Guide' },
      { url: 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching', title: 'MDN - HTTP Caching' }
    ]
  },
  {
    topic: 'GraphQL API design best practices',
    urls: [
      { url: 'https://graphql.org/learn/', title: 'GraphQL Official Documentation' },
      { url: 'https://www.apollographql.com/docs/', title: 'Apollo GraphQL Documentation' },
      { url: 'https://relay.dev/docs/', title: 'Relay Documentation' },
      { url: 'https://www.howtographql.com/', title: 'How to GraphQL Tutorial' },
      { url: 'https://engineering.shopify.com/blogs/engineering/solving-the-n-1-problem-for-graphql-through-batching', title: 'Shopify - GraphQL N+1 Problem' },
      { url: 'https://netflixtechblog.com/our-learnings-from-adopting-graphql-f099de39ae5f', title: 'Netflix - GraphQL Learnings' },
      { url: 'https://github.blog/2016-09-14-the-github-graphql-api/', title: 'GitHub GraphQL API' },
      { url: 'https://www.prisma.io/blog/graphql-server-basics-the-schema-ac5e2950214e', title: 'Prisma - GraphQL Schema Basics' },
      { url: 'https://hasura.io/learn/', title: 'Hasura GraphQL Tutorials' },
      { url: 'https://www.apollographql.com/blog/graphql/security/9-ways-to-secure-your-graphql-api-security-checklist/', title: 'Apollo - GraphQL Security' }
    ]
  }
];

// Database connection
const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  console.error('❌ Missing TURSO_DATABASE_URL');
  process.exit(1);
}

const client = createClient({ url, authToken });

// Track used topics
async function initTables() {
  console.log('📦 Ensuring tables exist...');
  
  await client.execute(`
    CREATE TABLE IF NOT EXISTS citation_blog_topics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT UNIQUE NOT NULL,
      used_at TEXT NOT NULL
    )
  `);
  
  // Ensure blog_posts table exists
  await client.execute(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id TEXT UNIQUE NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL,
      introduction TEXT,
      sections TEXT,
      conclusion TEXT,
      meta_description TEXT,
      channel TEXT,
      difficulty TEXT,
      tags TEXT,
      diagram TEXT,
      created_at TEXT,
      published_at TEXT,
      quick_reference TEXT,
      glossary TEXT,
      real_world_example TEXT,
      fun_fact TEXT,
      sources TEXT,
      social_snippet TEXT,
      diagram_type TEXT,
      diagram_label TEXT,
      images TEXT,
      company TEXT,
      incident_type TEXT
    )
  `);
  
  console.log('✅ Tables ready\n');
}

// Get random unused topic
async function getRandomTopic() {
  const result = await client.execute('SELECT topic FROM citation_blog_topics');
  const usedTopics = new Set(result.rows.map(r => r.topic));
  
  const availableTopics = TOPICS_WITH_SOURCES.filter(t => !usedTopics.has(t.topic));
  
  if (availableTopics.length === 0) {
    console.log('⚠️ All topics used, resetting...');
    await client.execute('DELETE FROM citation_blog_topics');
    return TOPICS_WITH_SOURCES[Math.floor(Math.random() * TOPICS_WITH_SOURCES.length)];
  }
  
  return availableTopics[Math.floor(Math.random() * availableTopics.length)];
}

// Mark topic as used
async function markTopicUsed(topic) {
  await client.execute({
    sql: 'INSERT OR REPLACE INTO citation_blog_topics (topic, used_at) VALUES (?, ?)',
    args: [topic, new Date().toISOString()]
  });
}

/**
 * Validate a URL by checking if it returns a valid response
 */
async function validateUrl(url, timeout = 10000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      }
    });
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 403 || response.status === 405;
  } catch (error) {
    // Try GET as fallback
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch {
      return false;
    }
  }
}

/**
 * Fetch content from a URL
 */
async function fetchContent(url, title, timeout = 15000) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) return null;
    
    const html = await response.text();
    
    // Extract text content (basic HTML stripping)
    const textContent = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
      .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 6000); // Limit content size
    
    return { url, title, content: textContent };
  } catch (error) {
    console.log(`   ⚠️ Failed to fetch ${url}: ${error.message}`);
    return null;
  }
}

/**
 * Validate and fetch content from URLs
 */
async function validateAndFetchSources(urls) {
  console.log(`\n🔍 Validating ${urls.length} URLs...`);
  
  const validSources = [];
  
  for (const item of urls) {
    if (!item.url) continue;
    
    const isValid = await validateUrl(item.url);
    
    if (isValid) {
      console.log(`   ✅ Valid: ${item.title?.substring(0, 50) || item.url}`);
      
      // Fetch content
      const content = await fetchContent(item.url, item.title);
      if (content && content.content.length > 200) {
        validSources.push(content);
      } else {
        console.log(`      (content too short, skipping)`);
      }
    } else {
      console.log(`   ❌ Invalid: ${item.url}`);
    }
    
    // Small delay to be nice to servers
    await new Promise(r => setTimeout(r, 300));
  }
  
  console.log(`\n📊 Valid sources with content: ${validSources.length}`);
  return validSources;
}

function detectSourceType(url) {
  if (url.includes('docs.') || url.includes('/documentation') || url.includes('/docs/')) return 'docs';
  if (url.includes('arxiv') || url.includes('paper')) return 'paper';
  if (url.includes('github.com')) return 'github';
  return 'blog';
}

function detectChannel(topic) {
  const text = topic.toLowerCase();
  
  if (text.includes('kubernetes') || text.includes('k8s') || text.includes('container')) return 'kubernetes';
  if (text.includes('database') || text.includes('sql') || text.includes('index')) return 'database';
  if (text.includes('aws') || text.includes('cloud') || text.includes('terraform')) return 'aws';
  if (text.includes('security') || text.includes('oauth') || text.includes('zero trust')) return 'security';
  if (text.includes('api') || text.includes('graphql') || text.includes('grpc') || text.includes('rate limit')) return 'backend';
  if (text.includes('devops') || text.includes('gitops') || text.includes('ci/cd')) return 'devops';
  if (text.includes('observability') || text.includes('monitoring') || text.includes('tracing')) return 'sre';
  if (text.includes('caching') || text.includes('redis') || text.includes('cache')) return 'backend';
  if (text.includes('microservice') || text.includes('architecture') || text.includes('distributed') || text.includes('event-driven')) return 'system-design';
  if (text.includes('circuit breaker') || text.includes('resilience')) return 'system-design';
  
  return 'system-design';
}

function generateSlug(title) {
  return title.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .substring(0, 80);
}

function generateId(topic) {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 6);
  const topicSlug = topic.split(' ').slice(0, 2).join('-').toLowerCase();
  return `cite-${topicSlug}-${timestamp}-${random}`;
}

async function saveBlogPost(blogContent, topic) {
  const now = new Date().toISOString();
  const questionId = generateId(topic);
  const slug = generateSlug(blogContent.title);
  const channel = detectChannel(topic);
  
  await client.execute({
    sql: `INSERT INTO blog_posts 
          (question_id, title, slug, introduction, sections, conclusion, 
           meta_description, channel, difficulty, tags, diagram, quick_reference,
           glossary, real_world_example, fun_fact, sources, social_snippet, 
           diagram_type, diagram_label, images, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      questionId,
      blogContent.title,
      slug,
      blogContent.introduction,
      JSON.stringify(blogContent.sections || []),
      blogContent.conclusion,
      blogContent.metaDescription,
      channel,
      blogContent.difficulty || 'intermediate',
      JSON.stringify(blogContent.tags || []),
      blogContent.diagram || null,
      JSON.stringify(blogContent.quickReference || []),
      JSON.stringify(blogContent.glossary || []),
      null,
      blogContent.funFact || null,
      JSON.stringify(blogContent.sources || []),
      JSON.stringify(blogContent.socialSnippet || null),
      blogContent.diagramType || null,
      blogContent.diagramLabel || null,
      JSON.stringify([]),
      now
    ]
  });
  
  return { questionId, slug };
}

// Main function
async function main() {
  console.log('=== 📚 Citation-First Blog Generator ===\n');
  console.log('Generating blog posts from REAL, validated sources\n');
  
  await initTables();
  
  // Get random topic with pre-curated sources
  const topicData = await getRandomTopic();
  console.log(`🎯 Selected topic: "${topicData.topic}"\n`);
  console.log(`📋 Pre-curated sources: ${topicData.urls.length}\n`);
  
  // Validate and fetch sources
  const validSources = await validateAndFetchSources(topicData.urls);
  
  if (validSources.length < MIN_VALID_SOURCES) {
    console.log(`\n❌ Could not validate ${MIN_VALID_SOURCES} sources for "${topicData.topic}"`);
    console.log(`   Only ${validSources.length} sources are valid`);
    
    // Mark as used anyway
    await markTopicUsed(topicData.topic);
    process.exit(1);
  }
  
  console.log(`\n✅ Validated ${validSources.length} sources with content!`);
  
  // Generate blog using LangGraph pipeline
  const result = await generateCitationBlog(topicData.topic, validSources.map(s => ({ url: s.url, title: s.title })));
  
  if (!result.success || !result.blogContent) {
    console.log('❌ Failed to generate blog content');
    console.log(`   Error: ${result.error || 'Unknown error'}`);
    process.exit(1);
  }
  
  const blogContent = result.blogContent;
  
  // Mark topic as used
  await markTopicUsed(topicData.topic);
  
  // Save to database
  console.log('\n💾 Saving to database...');
  const { questionId, slug } = await saveBlogPost(blogContent, topicData.topic);
  
  console.log(`\n✅ Blog post created!`);
  console.log(`   ID: ${questionId}`);
  console.log(`   Title: ${blogContent.title}`);
  console.log(`   Topic: ${topicData.topic}`);
  console.log(`   Sources: ${validSources.length} validated citations`);
  console.log(`   Slug: ${slug}`);
  
  // Get stats
  const stats = await client.execute('SELECT COUNT(*) as count FROM blog_posts');
  console.log(`\n📊 Total blog posts: ${stats.rows[0]?.count || 0}`);
  
  // Output for GitHub Actions
  if (process.env.GITHUB_OUTPUT) {
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `blog_id=${questionId}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `title=${blogContent.title}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `topic=${topicData.topic}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${slug}\n`);
    fs.appendFileSync(process.env.GITHUB_OUTPUT, `sources_count=${validSources.length}\n`);
  }
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
