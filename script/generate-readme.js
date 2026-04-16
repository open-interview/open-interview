#!/usr/bin/env node
/**
 * Auto-generates README sections from channels-config.ts
 * Replaces content between <!-- AUTO-GENERATED:* --> markers
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, '../client/src/lib/channels-config.ts');
const readmePath = path.join(__dirname, '../README.md');

function parseChannels() {
  const content = fs.readFileSync(configPath, 'utf-8');
  const channels = [];

  // Match each channel object block
  const blocks = content.matchAll(/\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/gs);
  for (const block of blocks) {
    const b = block[1];
    const id = b.match(/id:\s*['"]([^'"]+)['"]/)?.[1];
    const name = b.match(/name:\s*['"]([^'"]+)['"]/)?.[1];
    const category = b.match(/category:\s*['"]([^'"]+)['"]/)?.[1];
    const isCert = /isCertification:\s*true/.test(b);
    if (id && name && category) channels.push({ id, name, category, isCert });
  }
  return channels;
}

function buildCertTable(channels) {
  const certs = channels.filter(c => c.isCert);

  const groups = {
    AWS: { label: '**AWS**', items: [] },
    Kubernetes: { label: '**Kubernetes**', items: [] },
    HashiCorp: { label: '**HashiCorp**', items: [] },
    GCP: { label: '**Google Cloud**', items: [] },
    Azure: { label: '**Microsoft Azure**', items: [] },
    Linux: { label: '**Linux / Docker**', items: [] },
    Data: { label: '**Data & Analytics**', items: [] },
    Security: { label: '**Security**', items: [] },
    AI: { label: '**AI / ML**', items: [] },
  };

  for (const c of certs) {
    const n = c.name;
    if (c.id.startsWith('aws-')) groups.AWS.items.push(n);
    else if (['cka','ckad','cks','kcna'].includes(c.id)) groups.Kubernetes.items.push(n);
    else if (['terraform-associate','vault-associate','consul-associate'].includes(c.id)) groups.HashiCorp.items.push(n);
    else if (c.id.startsWith('gcp-')) groups.GCP.items.push(n);
    else if (c.id.startsWith('azure-')) groups.Azure.items.push(n);
    else if (['linux-foundation-sysadmin','rhcsa','docker-dca'].includes(c.id)) groups.Linux.items.push(n);
    else if (['databricks-data-engineer','snowflake-core','dbt-analytics-engineer'].includes(c.id)) groups.Data.items.push(n);
    else if (['comptia-security-plus','cissp'].includes(c.id)) groups.Security.items.push(n);
    else if (c.id === 'tensorflow-developer') groups.AI.items.push(n);
  }

  const rows = Object.values(groups)
    .filter(g => g.items.length > 0)
    .map(g => `| ${g.label} | ${g.items.join(', ')} |`);

  return `| Provider | Certifications |\n|----------|---------------|\n${rows.join('\n')}`;
}

function buildTopicsTable(channels) {
  const nonCert = channels.filter(c => !c.isCert);

  const categoryMap = {
    fundamentals: { emoji: '🧮', label: 'CS Fundamentals', items: [] },
    engineering:  { emoji: '🏗️', label: 'Engineering',     items: [] },
    cloud:        { emoji: '☁️', label: 'Cloud & DevOps',  items: [] },
    data:         { emoji: '📊', label: 'Data',            items: [] },
    ai:           { emoji: '🤖', label: 'AI / ML',         items: [] },
    security:     { emoji: '🔒', label: 'Security',        items: [] },
    mobile:       { emoji: '📱', label: 'Mobile',          items: [] },
    testing:      { emoji: '🧪', label: 'Testing',         items: [] },
    management:   { emoji: '👥', label: 'Soft Skills',     items: [] },
  };

  for (const c of nonCert) {
    categoryMap[c.category]?.items.push(c.name);
  }

  const rows = Object.values(categoryMap)
    .filter(g => g.items.length > 0)
    .map(g => `| ${g.emoji} ${g.label} | ${g.items.join(', ')} |`);

  return `| Category | Topics |\n|----------|--------|\n${rows.join('\n')}`;
}

function buildBadges(channels) {
  const certCount = channels.filter(c => c.isCert).length;
  const topicCount = channels.filter(c => !c.isCert).length;
  return { certCount, topicCount };
}

function replace(readme, marker, content) {
  const re = new RegExp(
    `(<!-- AUTO-GENERATED:${marker} -->)[\\s\\S]*?(<!-- /AUTO-GENERATED:${marker} -->)`,
    'g'
  );
  return readme.replace(re, `$1\n${content}\n$2`);
}

// Main
const channels = parseChannels();
const { certCount, topicCount } = buildBadges(channels);

let readme = fs.readFileSync(readmePath, 'utf-8');

readme = replace(readme, 'certifications', buildCertTable(channels));
readme = replace(readme, 'topics', buildTopicsTable(channels));
readme = replace(readme, 'badges',
  `<p align="center">\n` +
  `  <img src="https://img.shields.io/github/stars/open-interview/open-interview?style=for-the-badge&logo=github&color=yellow" alt="Stars" />\n` +
  `  <img src="https://img.shields.io/badge/questions-1000+-blue?style=for-the-badge" alt="Questions" />\n` +
  `  <img src="https://img.shields.io/badge/certifications-${certCount}+-green?style=for-the-badge" alt="Certifications" />\n` +
  `  <img src="https://img.shields.io/badge/topics-${topicCount}+-orange?style=for-the-badge" alt="Topics" />\n` +
  `  <img src="https://img.shields.io/badge/AI_Powered-Vector_DB-purple?style=for-the-badge" alt="AI" />\n` +
  `</p>`
);

fs.writeFileSync(readmePath, readme);
console.log(`✅ README updated — ${certCount} certs, ${topicCount} topics`);
