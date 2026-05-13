#!/usr/bin/env node

import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER || 'satishkumar-dhule';
const REPO_NAME = process.env.REPO_NAME || 'code-reels';
const PAGES_REPO_OWNER = process.env.PAGES_REPO_OWNER || 'open-interview';
const PAGES_REPO_NAME = process.env.PAGES_REPO_NAME || 'open-interview.github.io';

const ANALYTICS_FILE = path.join(__dirname, '..', 'data', 'github-analytics.json');

function readAnalytics() {
  if (!fs.existsSync(ANALYTICS_FILE)) return [];
  try { return JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf8')); } catch { return []; }
}

function writeAnalytics(data) {
  const dir = path.dirname(ANALYTICS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
}

async function fetchGitHubAPI(endpoint, repo = `${REPO_OWNER}/${REPO_NAME}`) {
  const url = `https://api.github.com/repos/${repo}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28'
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`GitHub API error (${response.status}): ${error}`);
  }

  return response.json();
}

async function collectTrafficViews(repo) {
  console.log(`\n📊 Fetching page views for ${repo}...`);
  const data = await fetchGitHubAPI('/traffic/views', repo);
  const analytics = readAnalytics();

  for (const view of data.views || []) {
    const date = view.timestamp.split('T')[0];
    const key = `${date}|${repo}|views|daily`;
    const existing = analytics.find(a => a._key === key);
    if (existing) {
      existing.count = view.count;
      existing.uniques = view.uniques;
    } else {
      analytics.push({
        _key: key, date, repo, metricType: 'views', metricName: 'daily', count: view.count, uniques: view.uniques, createdAt: new Date().toISOString()
      });
    }
  }

  writeAnalytics(analytics);
  console.log(`  ✓ ${data.views?.length || 0} days of view data saved`);
  return data;
}

async function collectTrafficClones(repo) {
  console.log(`📥 Fetching clone data for ${repo}...`);
  const data = await fetchGitHubAPI('/traffic/clones', repo);
  const analytics = readAnalytics();

  for (const clone of data.clones || []) {
    const date = clone.timestamp.split('T')[0];
    const key = `${date}|${repo}|clones|daily`;
    const existing = analytics.find(a => a._key === key);
    if (existing) {
      existing.count = clone.count;
      existing.uniques = clone.uniques;
    } else {
      analytics.push({
        _key: key, date, repo, metricType: 'clones', metricName: 'daily', count: clone.count, uniques: clone.uniques, createdAt: new Date().toISOString()
      });
    }
  }

  writeAnalytics(analytics);
  console.log(`  ✓ ${data.clones?.length || 0} days of clone data saved`);
  return data;
}

async function collectReferrers(repo) {
  console.log(`🔗 Fetching top referrers for ${repo}...`);
  const data = await fetchGitHubAPI('/traffic/popular/referrers', repo);
  const today = new Date().toISOString().split('T')[0];
  const analytics = readAnalytics();

  for (const ref of data || []) {
    const key = `${today}|${repo}|referrer|${ref.referrer}`;
    const existing = analytics.find(a => a._key === key);
    if (existing) {
      existing.count = ref.count;
      existing.uniques = ref.uniques;
    } else {
      analytics.push({
        _key: key, date: today, repo, metricType: 'referrer', metricName: ref.referrer, count: ref.count, uniques: ref.uniques, createdAt: new Date().toISOString()
      });
    }
  }

  writeAnalytics(analytics);
  console.log(`  ✓ ${data?.length || 0} referrers saved`);
  return data;
}

async function collectPopularPaths(repo) {
  console.log(`📄 Fetching popular paths for ${repo}...`);
  const data = await fetchGitHubAPI('/traffic/popular/paths', repo);
  const today = new Date().toISOString().split('T')[0];
  const analytics = readAnalytics();

  for (const pathEntry of data || []) {
    const key = `${today}|${repo}|path|${pathEntry.path}`;
    const existing = analytics.find(a => a._key === key);
    if (existing) {
      existing.count = pathEntry.count;
      existing.uniques = pathEntry.uniques;
    } else {
      analytics.push({
        _key: key, date: today, repo, metricType: 'path', metricName: pathEntry.path, count: pathEntry.count, uniques: pathEntry.uniques, createdAt: new Date().toISOString()
      });
    }
  }

  writeAnalytics(analytics);
  console.log(`  ✓ ${data?.length || 0} popular paths saved`);
  return data;
}

async function collectRepoStats(repo) {
  console.log(`⭐ Fetching repo stats for ${repo}...`);
  const data = await fetchGitHubAPI('', repo);
  const today = new Date().toISOString().split('T')[0];
  const analytics = readAnalytics();

  const stats = [
    { name: 'stars', count: data.stargazers_count },
    { name: 'forks', count: data.forks_count },
    { name: 'watchers', count: data.subscribers_count },
    { name: 'open_issues', count: data.open_issues_count },
    { name: 'size_kb', count: data.size },
  ];

  for (const stat of stats) {
    const key = `${today}|${repo}|repo_stat|${stat.name}`;
    const existing = analytics.find(a => a._key === key);
    if (existing) {
      existing.count = stat.count;
    } else {
      analytics.push({
        _key: key, date: today, repo, metricType: 'repo_stat', metricName: stat.name, count: stat.count, uniques: 0, createdAt: new Date().toISOString()
      });
    }
  }

  writeAnalytics(analytics);
  console.log(`  ✓ Repo stats saved (⭐${data.stargazers_count} 🍴${data.forks_count})`);
  return data;
}

async function main() {
  console.log('🚀 GitHub Analytics Bot Starting...\n');

  if (!GITHUB_TOKEN) {
    console.error('❌ GITHUB_TOKEN or GH_TOKEN is required');
    process.exit(1);
  }

  try {
    const repos = [
      `${REPO_OWNER}/${REPO_NAME}`,
      `${PAGES_REPO_OWNER}/${PAGES_REPO_NAME}`
    ];

    const summary = { views: 0, clones: 0, referrers: 0, paths: 0 };

    for (const repo of repos) {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`Processing: ${repo}`);
      console.log('='.repeat(50));

      try {
        const views = await collectTrafficViews(repo);
        summary.views += views.count || 0;

        const clones = await collectTrafficClones(repo);
        summary.clones += clones.count || 0;

        const referrers = await collectReferrers(repo);
        summary.referrers += referrers?.length || 0;

        const paths = await collectPopularPaths(repo);
        summary.paths += paths?.length || 0;

        await collectRepoStats(repo);
      } catch (err) {
        console.error(`  ⚠️ Error processing ${repo}: ${err.message}`);
      }
    }

    console.log('\n' + '='.repeat(50));
    console.log('📈 Summary');
    console.log('='.repeat(50));
    console.log(`  Total Views (14d): ${summary.views}`);
    console.log(`  Total Clones (14d): ${summary.clones}`);
    console.log(`  Referrers tracked: ${summary.referrers}`);
    console.log(`  Popular paths: ${summary.paths}`);
    console.log('\n✅ GitHub Analytics collection complete!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

main();
