#!/usr/bin/env node
/**
 * Seed channels and subchannels tables from existing config
 * Run once to migrate from hardcoded config to DB
 */

import { createClient } from '@libsql/client';
import dotenv from 'dotenv';

dotenv.config();

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Channel configurations (migrated from channels-config.ts)
const channelsData = [
  // Engineering Channels
  { id: 'system-design', name: 'System Design', description: 'Scalable architecture patterns & distributed systems', icon: 'cpu', color: 'text-cyan-500', category: 'engineering', roles: ['backend', 'fullstack', 'architect', 'sre', 'devops'], sortOrder: 1 },
  { id: 'algorithms', name: 'Algorithms', description: 'Data structures, sorting, searching & optimization', icon: 'terminal', color: 'text-green-500', category: 'engineering', roles: ['backend', 'fullstack', 'frontend', 'mobile', 'data-engineer'], sortOrder: 2 },
  { id: 'frontend', name: 'Frontend', description: 'React, Vue, CSS, Performance & Web APIs', icon: 'layout', color: 'text-purple-500', category: 'engineering', roles: ['frontend', 'fullstack', 'mobile'], sortOrder: 3 },
  { id: 'backend', name: 'Backend', description: 'APIs, microservices, caching & server architecture', icon: 'server', color: 'text-blue-500', category: 'engineering', roles: ['backend', 'fullstack', 'architect'], sortOrder: 4 },
  { id: 'database', name: 'Database', description: 'SQL, NoSQL, indexing & query optimization', icon: 'database', color: 'text-yellow-500', category: 'engineering', roles: ['backend', 'fullstack', 'data-engineer', 'dba'], sortOrder: 5 },
  { id: 'python', name: 'Python', description: 'Python fundamentals, libraries & best practices', icon: 'code', color: 'text-yellow-400', category: 'engineering', roles: ['backend', 'data-engineer', 'ml-engineer', 'data-scientist'], sortOrder: 6 },
  { id: 'networking', name: 'Networking', description: 'TCP/IP, DNS, load balancing & CDN', icon: 'network', color: 'text-indigo-500', category: 'engineering', roles: ['sre', 'devops', 'security', 'backend'], sortOrder: 7 },
  { id: 'operating-systems', name: 'Operating Systems', description: 'OS concepts, processes, memory & file systems', icon: 'monitor', color: 'text-slate-500', category: 'engineering', roles: ['backend', 'sre', 'devops', 'security', 'platform'], sortOrder: 8 },
  { id: 'linux', name: 'Linux', description: 'Linux administration, shell scripting & system tools', icon: 'terminal', color: 'text-yellow-600', category: 'engineering', roles: ['backend', 'sre', 'devops', 'security', 'platform', 'data-engineer'], sortOrder: 9 },
  { id: 'unix', name: 'Unix', description: 'Unix fundamentals, commands & system programming', icon: 'terminal', color: 'text-gray-500', category: 'engineering', roles: ['backend', 'sre', 'devops', 'security', 'platform'], sortOrder: 10 },
  
  // Cloud & DevOps
  { id: 'devops', name: 'DevOps', description: 'CI/CD, automation, containers & orchestration', icon: 'infinity', color: 'text-orange-500', category: 'cloud', roles: ['devops', 'sre', 'backend', 'platform'], sortOrder: 11 },
  { id: 'sre', name: 'SRE', description: 'Reliability, monitoring, incident response & SLOs', icon: 'activity', color: 'text-red-500', category: 'cloud', roles: ['sre', 'devops', 'platform'], sortOrder: 12 },
  { id: 'kubernetes', name: 'Kubernetes', description: 'Container orchestration, pods, services & deployments', icon: 'box', color: 'text-blue-400', category: 'cloud', roles: ['devops', 'sre', 'platform', 'backend'], sortOrder: 13 },
  { id: 'aws', name: 'AWS', description: 'EC2, S3, Lambda, RDS & cloud architecture', icon: 'cloud', color: 'text-orange-400', category: 'cloud', roles: ['devops', 'sre', 'backend', 'architect', 'platform'], sortOrder: 14 },
  { id: 'terraform', name: 'Terraform', description: 'Infrastructure as Code, modules & state management', icon: 'layers', color: 'text-purple-400', category: 'cloud', roles: ['devops', 'sre', 'platform'], sortOrder: 15 },
  
  // Data
  { id: 'data-engineering', name: 'Data Engineering', description: 'ETL, data pipelines, warehousing & streaming', icon: 'workflow', color: 'text-teal-500', category: 'data', roles: ['data-engineer', 'backend', 'ml-engineer'], sortOrder: 16 },
  
  // AI & ML
  { id: 'machine-learning', name: 'Machine Learning', description: 'ML algorithms, model training & deployment', icon: 'brain', color: 'text-pink-500', category: 'ai', roles: ['ml-engineer', 'data-scientist', 'ai-engineer'], sortOrder: 17 },
  { id: 'generative-ai', name: 'Generative AI', description: 'LLMs, RAG, fine-tuning, agents & prompt engineering', icon: 'sparkles', color: 'text-violet-500', category: 'ai', roles: ['ai-engineer', 'ml-engineer', 'fullstack', 'backend'], sortOrder: 18 },
  { id: 'prompt-engineering', name: 'Prompt Engineering', description: 'Prompt design, optimization, safety & structured outputs', icon: 'message-circle', color: 'text-cyan-400', category: 'ai', roles: ['ai-engineer', 'ml-engineer', 'fullstack', 'product'], sortOrder: 19 },
  { id: 'llm-ops', name: 'LLMOps', description: 'LLM deployment, optimization, monitoring & infrastructure', icon: 'server', color: 'text-orange-400', category: 'ai', roles: ['ai-engineer', 'ml-engineer', 'devops', 'sre'], sortOrder: 20 },
  { id: 'computer-vision', name: 'Computer Vision', description: 'Image classification, object detection & multimodal AI', icon: 'eye', color: 'text-blue-400', category: 'ai', roles: ['ml-engineer', 'ai-engineer', 'data-scientist'], sortOrder: 21 },
  { id: 'nlp', name: 'NLP', description: 'Text processing, embeddings, transformers & language models', icon: 'file-text', color: 'text-emerald-400', category: 'ai', roles: ['ml-engineer', 'ai-engineer', 'data-scientist'], sortOrder: 22 },
  
  // Security
  { id: 'security', name: 'Security', description: 'Application security, OWASP, encryption & auth', icon: 'shield', color: 'text-red-400', category: 'security', roles: ['security', 'backend', 'fullstack', 'devops'], sortOrder: 23 },
  
  // Mobile
  { id: 'ios', name: 'iOS', description: 'Swift, UIKit, SwiftUI & iOS architecture', icon: 'smartphone', color: 'text-gray-400', category: 'mobile', roles: ['mobile', 'ios'], sortOrder: 24 },
  { id: 'android', name: 'Android', description: 'Kotlin, Jetpack Compose & Android architecture', icon: 'smartphone', color: 'text-green-400', category: 'mobile', roles: ['mobile', 'android'], sortOrder: 25 },
  { id: 'react-native', name: 'React Native', description: 'Cross-platform mobile development with React', icon: 'smartphone', color: 'text-cyan-400', category: 'mobile', roles: ['mobile', 'frontend', 'fullstack'], sortOrder: 26 },
  
  // Testing
  { id: 'testing', name: 'Testing', description: 'Unit testing, integration testing, TDD & test strategies', icon: 'check-circle', color: 'text-green-500', category: 'testing', roles: ['frontend', 'backend', 'fullstack', 'mobile', 'qa'], sortOrder: 27 },
  { id: 'e2e-testing', name: 'E2E Testing', description: 'Playwright, Cypress, Selenium & browser automation', icon: 'monitor', color: 'text-purple-500', category: 'testing', roles: ['frontend', 'fullstack', 'qa', 'sdet'], sortOrder: 28 },
  { id: 'api-testing', name: 'API Testing', description: 'REST API testing, contract testing & load testing', icon: 'zap', color: 'text-yellow-500', category: 'testing', roles: ['backend', 'fullstack', 'qa', 'sdet'], sortOrder: 29 },
  { id: 'performance-testing', name: 'Performance Testing', description: 'Load testing, stress testing, JMeter & k6', icon: 'gauge', color: 'text-orange-500', category: 'testing', roles: ['sre', 'backend', 'qa', 'sdet', 'devops'], sortOrder: 30 },
  
  // Management
  { id: 'engineering-management', name: 'Engineering Management', description: 'Team leadership, 1:1s, hiring & project management', icon: 'users', color: 'text-amber-500', category: 'management', roles: ['manager', 'tech-lead', 'architect'], sortOrder: 31 },
  { id: 'behavioral', name: 'Behavioral', description: 'STAR method, leadership principles & soft skills', icon: 'message-circle', color: 'text-emerald-500', category: 'management', roles: ['all'], sortOrder: 32 },
];

// Subchannel configurations (migrated from generate-question.js)
const subchannelsData = {
  'system-design': [
    { subChannel: 'infrastructure', name: 'Infrastructure', tags: ['infra', 'scale', 'distributed'] },
    { subChannel: 'distributed-systems', name: 'Distributed Systems', tags: ['dist-sys', 'cap-theorem', 'consensus'] },
    { subChannel: 'api-design', name: 'API Design', tags: ['api', 'rest', 'grpc', 'graphql'] },
    { subChannel: 'caching', name: 'Caching', tags: ['cache', 'redis', 'memcached', 'cdn'] },
    { subChannel: 'load-balancing', name: 'Load Balancing', tags: ['lb', 'traffic', 'nginx', 'haproxy'] },
    { subChannel: 'message-queues', name: 'Message Queues', tags: ['kafka', 'rabbitmq', 'sqs', 'pubsub'] },
  ],
  'algorithms': [
    { subChannel: 'data-structures', name: 'Data Structures', tags: ['arrays', 'linkedlist', 'hashtable', 'heap'] },
    { subChannel: 'sorting', name: 'Sorting', tags: ['quicksort', 'mergesort', 'complexity'] },
    { subChannel: 'dynamic-programming', name: 'Dynamic Programming', tags: ['dp', 'memoization', 'tabulation'] },
    { subChannel: 'graphs', name: 'Graphs', tags: ['bfs', 'dfs', 'dijkstra', 'topological'] },
    { subChannel: 'trees', name: 'Trees', tags: ['bst', 'avl', 'trie', 'segment-tree'] },
  ],
  'frontend': [
    { subChannel: 'react', name: 'React', tags: ['react', 'hooks', 'context', 'redux'] },
    { subChannel: 'javascript', name: 'JavaScript', tags: ['js', 'es6', 'closures', 'promises'] },
    { subChannel: 'css', name: 'CSS', tags: ['css', 'flexbox', 'grid', 'animations'] },
    { subChannel: 'performance', name: 'Performance', tags: ['lighthouse', 'bundle', 'lazy-loading'] },
    { subChannel: 'web-apis', name: 'Web APIs', tags: ['dom', 'fetch', 'websocket', 'service-worker'] },
  ],
  'backend': [
    { subChannel: 'apis', name: 'APIs', tags: ['rest', 'graphql', 'grpc', 'openapi'] },
    { subChannel: 'microservices', name: 'Microservices', tags: ['saga', 'cqrs', 'event-sourcing'] },
    { subChannel: 'caching', name: 'Caching', tags: ['redis', 'memcached', 'cache-invalidation'] },
    { subChannel: 'authentication', name: 'Authentication', tags: ['jwt', 'oauth2', 'oidc', 'saml'] },
    { subChannel: 'server-architecture', name: 'Server Architecture', tags: ['scaling', 'sharding', 'replication'] },
  ],
  'database': [
    { subChannel: 'sql', name: 'SQL', tags: ['joins', 'indexes', 'normalization', 'postgres'] },
    { subChannel: 'nosql', name: 'NoSQL', tags: ['mongodb', 'dynamodb', 'cassandra', 'redis'] },
    { subChannel: 'indexing', name: 'Indexing', tags: ['btree', 'hash-index', 'composite'] },
    { subChannel: 'transactions', name: 'Transactions', tags: ['acid', 'isolation-levels', 'mvcc'] },
    { subChannel: 'query-optimization', name: 'Query Optimization', tags: ['explain', 'query-plan', 'partitioning'] },
  ],
  'devops': [
    { subChannel: 'cicd', name: 'CI/CD', tags: ['github-actions', 'jenkins', 'gitlab-ci'] },
    { subChannel: 'docker', name: 'Docker', tags: ['dockerfile', 'compose', 'multi-stage'] },
    { subChannel: 'automation', name: 'Automation', tags: ['ansible', 'puppet', 'chef'] },
    { subChannel: 'gitops', name: 'GitOps', tags: ['argocd', 'flux', 'declarative'] },
  ],
  'sre': [
    { subChannel: 'observability', name: 'Observability', tags: ['prometheus', 'grafana', 'opentelemetry'] },
    { subChannel: 'reliability', name: 'Reliability', tags: ['slo', 'sli', 'error-budget'] },
    { subChannel: 'incident-management', name: 'Incident Management', tags: ['pagerduty', 'runbooks', 'postmortem'] },
    { subChannel: 'chaos-engineering', name: 'Chaos Engineering', tags: ['chaos-monkey', 'litmus', 'gremlin'] },
    { subChannel: 'capacity-planning', name: 'Capacity Planning', tags: ['forecasting', 'autoscaling', 'load-testing'] },
  ],
  'kubernetes': [
    { subChannel: 'pods', name: 'Pods', tags: ['containers', 'init-containers', 'sidecars'] },
    { subChannel: 'services', name: 'Services', tags: ['clusterip', 'nodeport', 'loadbalancer', 'ingress'] },
    { subChannel: 'deployments', name: 'Deployments', tags: ['rolling-update', 'canary', 'blue-green'] },
    { subChannel: 'helm', name: 'Helm', tags: ['charts', 'values', 'templating'] },
    { subChannel: 'operators', name: 'Operators', tags: ['crds', 'controllers', 'reconciliation'] },
  ],
  'aws': [
    { subChannel: 'compute', name: 'Compute', tags: ['ec2', 'ecs', 'eks', 'fargate'] },
    { subChannel: 'storage', name: 'Storage', tags: ['s3', 'ebs', 'efs', 'glacier'] },
    { subChannel: 'serverless', name: 'Serverless', tags: ['lambda', 'api-gateway', 'step-functions'] },
    { subChannel: 'database', name: 'Database', tags: ['rds', 'aurora', 'dynamodb', 'elasticache'] },
    { subChannel: 'networking', name: 'Networking', tags: ['vpc', 'route53', 'cloudfront', 'alb'] },
  ],
  'generative-ai': [
    { subChannel: 'llm-fundamentals', name: 'LLM Fundamentals', tags: ['transformer', 'attention', 'tokenization'] },
    { subChannel: 'fine-tuning', name: 'Fine-tuning', tags: ['lora', 'qlora', 'peft', 'adapter'] },
    { subChannel: 'rag', name: 'RAG', tags: ['retrieval', 'embeddings', 'vector-db', 'chunking'] },
    { subChannel: 'agents', name: 'Agents', tags: ['langchain', 'autogen', 'tool-use', 'planning'] },
    { subChannel: 'evaluation', name: 'Evaluation', tags: ['hallucination', 'faithfulness', 'relevance'] },
  ],
  'machine-learning': [
    { subChannel: 'algorithms', name: 'Algorithms', tags: ['regression', 'classification', 'clustering'] },
    { subChannel: 'model-training', name: 'Model Training', tags: ['hyperparameter', 'cross-validation', 'regularization'] },
    { subChannel: 'deployment', name: 'Deployment', tags: ['mlflow', 'kubeflow', 'sagemaker'] },
    { subChannel: 'deep-learning', name: 'Deep Learning', tags: ['cnn', 'rnn', 'transformer', 'attention'] },
    { subChannel: 'evaluation', name: 'Evaluation', tags: ['precision', 'recall', 'auc-roc', 'f1'] },
  ],
  'security': [
    { subChannel: 'application-security', name: 'Application Security', tags: ['xss', 'csrf', 'sqli', 'ssrf'] },
    { subChannel: 'owasp', name: 'OWASP', tags: ['top10', 'asvs', 'samm'] },
    { subChannel: 'encryption', name: 'Encryption', tags: ['aes', 'rsa', 'tls', 'hashing'] },
    { subChannel: 'authentication', name: 'Authentication', tags: ['mfa', 'passkeys', 'zero-trust'] },
  ],
  'testing': [
    { subChannel: 'unit-testing', name: 'Unit Testing', tags: ['jest', 'mocha', 'pytest', 'junit'] },
    { subChannel: 'integration-testing', name: 'Integration Testing', tags: ['api-testing', 'database-testing', 'mocking'] },
    { subChannel: 'tdd', name: 'TDD', tags: ['test-driven', 'red-green-refactor', 'test-first'] },
    { subChannel: 'test-strategies', name: 'Test Strategies', tags: ['test-pyramid', 'coverage', 'mutation-testing'] },
  ],
  'behavioral': [
    { subChannel: 'star-method', name: 'STAR Method', tags: ['situation', 'task', 'action', 'result'] },
    { subChannel: 'leadership-principles', name: 'Leadership Principles', tags: ['ownership', 'bias-for-action', 'customer-obsession'] },
    { subChannel: 'soft-skills', name: 'Soft Skills', tags: ['communication', 'collaboration', 'influence'] },
    { subChannel: 'conflict-resolution', name: 'Conflict Resolution', tags: ['negotiation', 'mediation', 'feedback'] },
  ],
};

async function main() {
  console.log('=== Seeding Channels & Subchannels ===\n');

  // Create tables if they don't exist
  console.log('Creating tables...');
  
  await client.execute(`
    CREATE TABLE IF NOT EXISTS channels (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL,
      category TEXT NOT NULL,
      roles TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS subchannels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel_id TEXT NOT NULL REFERENCES channels(id),
      sub_channel TEXT NOT NULL,
      name TEXT NOT NULL,
      tags TEXT,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(channel_id, sub_channel)
    )
  `);

  // Insert channels
  console.log('\nInserting channels...');
  let channelCount = 0;
  
  for (const ch of channelsData) {
    try {
      await client.execute({
        sql: `INSERT OR REPLACE INTO channels (id, name, description, icon, color, category, roles, sort_order) 
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [ch.id, ch.name, ch.description, ch.icon, ch.color, ch.category, JSON.stringify(ch.roles), ch.sortOrder]
      });
      channelCount++;
      console.log(`  ✓ ${ch.id}`);
    } catch (err) {
      console.error(`  ✗ ${ch.id}: ${err.message}`);
    }
  }

  // Insert subchannels
  console.log('\nInserting subchannels...');
  let subchannelCount = 0;
  
  for (const [channelId, subs] of Object.entries(subchannelsData)) {
    for (let i = 0; i < subs.length; i++) {
      const sub = subs[i];
      try {
        await client.execute({
          sql: `INSERT OR REPLACE INTO subchannels (channel_id, sub_channel, name, tags, sort_order) 
                VALUES (?, ?, ?, ?, ?)`,
          args: [channelId, sub.subChannel, sub.name, JSON.stringify(sub.tags), i + 1]
        });
        subchannelCount++;
      } catch (err) {
        console.error(`  ✗ ${channelId}/${sub.subChannel}: ${err.message}`);
      }
    }
    console.log(`  ✓ ${channelId}: ${subs.length} subchannels`);
  }

  console.log(`\n=== Summary ===`);
  console.log(`Channels: ${channelCount}`);
  console.log(`Subchannels: ${subchannelCount}`);
  console.log('\nDone!');
}

main().catch(console.error);
