import 'dotenv/config';
import { spawn } from 'child_process';
import https from 'https';
import fs from 'fs';
import path from 'path';

const QUESTIONS_DIR = path.join(process.cwd(), 'data', 'questions');
const BOT_DATA_DIR = path.join(process.cwd(), 'data', 'bot-data');
const CHANNEL_MAPPINGS_FILE = path.join(process.cwd(), 'data', 'channel-mappings.json');
const WORK_QUEUE_FILE = path.join(BOT_DATA_DIR, 'work-queue.json');
const BOT_ACTIVITY_FILE = path.join(BOT_DATA_DIR, 'bot-activity.json');

function readJsonFile(filepath) {
  if (!fs.existsSync(filepath)) return null;
  try { return JSON.parse(fs.readFileSync(filepath, 'utf8')); } catch { return null; }
}

function writeJsonFile(filepath, data) {
  const dir = path.dirname(filepath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
}

function readChannelFile(channel) {
  return readJsonFile(path.join(QUESTIONS_DIR, `${channel}.json`)) || [];
}

function writeChannelFile(channel, data) {
  writeJsonFile(path.join(QUESTIONS_DIR, `${channel}.json`), data);
}

function readAllQuestions() {
  if (!fs.existsSync(QUESTIONS_DIR)) return [];
  return fs.readdirSync(QUESTIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .flatMap(f => readJsonFile(path.join(QUESTIONS_DIR, f)) || []);
}

function findQuestionById(questionId) {
  if (!fs.existsSync(QUESTIONS_DIR)) return null;
  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
  for (const f of files) {
    try {
      const questions = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, f), 'utf8'));
      const found = questions.find(q => q.id === questionId);
      if (found) return found;
    } catch {}
  }
  return null;
}

// Constants
export const MAX_RETRIES = 3;
export const RETRY_DELAY_MS = 10000;
export const TIMEOUT_MS = 300000; // 5 minutes

// ============================================
// DATABASE OPERATIONS (file-based)
// ============================================

// Cache for questions within a single bot run
let _questionsCache = null;
let _questionsCacheTime = 0;
const CACHE_TTL_MS = 60000; // 1 minute cache

// Cache for work queue initialization
let _workQueueInitialized = false;

// Clear caches (useful for testing or long-running processes)
export function clearCaches() {
  _questionsCache = null;
  _questionsCacheTime = 0;
  _workQueueInitialized = false;
}

// Load all questions from files
export async function loadUnifiedQuestions() {
  const all = readAllQuestions();
  const questions = {};
  for (const q of all) {
    questions[q.id] = q;
  }
  return questions;
}

// Get all questions as array (with caching for single bot run)
export async function getAllUnifiedQuestions(useCache = true) {
  const now = Date.now();
  
  if (useCache && _questionsCache && (now - _questionsCacheTime) < CACHE_TTL_MS) {
    return _questionsCache;
  }
  
  const questions = readAllQuestions();
  
  _questionsCache = questions;
  _questionsCacheTime = now;
  
  return questions;
}

// Get question count without fetching all data
export async function getQuestionCount(channel = null) {
  if (channel) {
    return readChannelFile(channel).length;
  }
  
  if (!fs.existsSync(QUESTIONS_DIR)) return 0;
  let count = 0;
  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
  for (const f of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, f), 'utf8'));
      count += data.length;
    } catch {}
  }
  return count;
}

// Get channel question counts
export async function getChannelQuestionCounts() {
  if (!fs.existsSync(QUESTIONS_DIR)) return {};
  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
  const counts = {};
  for (const f of files) {
    try {
      const channel = f.replace(/\.json$/, '');
      const data = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, f), 'utf8'));
      counts[channel] = data.length;
    } catch {}
  }
  return counts;
}

// Get sub-channel question counts for prioritization
export async function getSubChannelQuestionCounts() {
  const mappings = await loadChannelMappings();
  const counts = {};
  for (const [channel, data] of Object.entries(mappings)) {
    for (const [subChannel, questionIds] of Object.entries(data.subChannels || {})) {
      if (!counts[channel]) counts[channel] = {};
      counts[channel][subChannel] = questionIds.length;
    }
  }
  return counts;
}

// Get certifications/channels with fewest questions for prioritization
export async function getPrioritizedChannels(channelList, limit = 10) {
  if (!channelList || channelList.length === 0) {
    return [];
  }
  
  const channelCounts = await getChannelQuestionCounts();
  
  const sorted = channelList.map(ch => ({
    channel: ch,
    count: channelCounts[ch] || 0
  })).sort((a, b) => a.count - b.count);
  
  const zeroCount = sorted.filter(c => c.count === 0);
  const lowCount = sorted.filter(c => c.count > 0);
  
  const prioritized = [...zeroCount, ...lowCount].slice(0, limit);
  
  return prioritized.map(c => c.channel);
}

// Save/update a question
export async function saveQuestion(question) {
  const { validateBeforeInsert, sanitizeQuestion } = await import('./bots/shared/validation.js');
  
  try {
    validateBeforeInsert(question, 'utils.saveQuestion');
  } catch (error) {
    console.error(`\n❌ VALIDATION FAILED - Question rejected by saveQuestion:`);
    console.error(error.message);
    throw error;
  }
  
  const sanitized = sanitizeQuestion(question);
  
  if (sanitized._sanitized) {
    console.warn(`⚠️  Question ${question.id} had JSON in answer field - sanitized automatically`);
  }
  
  const channel = sanitized.channel || 'uncategorized';
  const questions = readChannelFile(channel);
  const idx = questions.findIndex(q => q.id === sanitized.id);
  
  if (idx >= 0) {
    questions[idx] = sanitized;
  } else {
    questions.push(sanitized);
  }
  
  writeChannelFile(channel, questions);
  
  console.log(`✅ Question ${sanitized.id} validated and saved successfully`);
}

// Save all questions (batch update)
export async function saveUnifiedQuestions(questions) {
  const { validateBeforeInsert, sanitizeQuestion } = await import('./bots/shared/validation.js');
  
  const byChannel = {};
  let validCount = 0;
  let invalidCount = 0;
  
  for (const [id, q] of Object.entries(questions)) {
    try {
      validateBeforeInsert(q, 'utils.saveUnifiedQuestions');
      const sanitized = sanitizeQuestion(q);
      
      if (sanitized._sanitized) {
        console.warn(`⚠️  Question ${id} had JSON in answer field - sanitized automatically`);
      }
      
      const channel = sanitized.channel || 'uncategorized';
      if (!byChannel[channel]) byChannel[channel] = {};
      byChannel[channel][id] = sanitized;
      
      validCount++;
    } catch (error) {
      console.error(`❌ Validation failed for question ${id}: ${error.message}`);
      invalidCount++;
    }
  }
  
  console.log(`\n📊 Batch validation results:`);
  console.log(`   ✅ Valid: ${validCount}`);
  console.log(`   ❌ Invalid (skipped): ${invalidCount}`);
  
  for (const [channel, channelQuestions] of Object.entries(byChannel)) {
    const existing = readChannelFile(channel);
    for (const [, sanitized] of Object.entries(channelQuestions)) {
      const idx = existing.findIndex(q => q.id === sanitized.id);
      if (idx >= 0) {
        existing[idx] = sanitized;
      } else {
        existing.push(sanitized);
      }
    }
    writeChannelFile(channel, existing);
  }
  
  console.log(`✅ Saved ${validCount} validated questions to files`);
}

// Load channel mappings from file
export async function loadChannelMappings() {
  return readJsonFile(CHANNEL_MAPPINGS_FILE) || {};
}

// Save channel mappings to file
export async function saveChannelMappings(mappings) {
  writeJsonFile(CHANNEL_MAPPINGS_FILE, mappings);
}

// Add a question and map to channels
export async function addUnifiedQuestion(question, channels) {
  question.channel = channels[0].channel;
  question.subChannel = channels[0].subChannel;
  
  await saveQuestion(question);
  
  const mappings = await loadChannelMappings();
  for (const { channel, subChannel } of channels) {
    if (!mappings[channel]) {
      mappings[channel] = { subChannels: {} };
    }
    if (!mappings[channel].subChannels[subChannel]) {
      mappings[channel].subChannels[subChannel] = [];
    }
    if (!mappings[channel].subChannels[subChannel].includes(question.id)) {
      mappings[channel].subChannels[subChannel].push(question.id);
    }
  }
  await saveChannelMappings(mappings);
  
  try {
    const vectorDB = (await import('./ai/services/vector-db.js')).default;
    await vectorDB.indexQuestion(question);
    console.log(`   📊 Indexed in vector DB: ${question.id}`);
  } catch (error) {
    console.log(`   ⚠️ Vector indexing skipped: ${error.message}`);
  }
  
  _questionsCache = null;
}

// Get questions for a specific channel
export async function getQuestionsForChannel(channel) {
  return readChannelFile(channel);
}

// ============================================
// PRIORITIZATION QUERIES
// ============================================

// Get questions that need improvement, sorted by priority
export async function getQuestionsNeedingImprovement(limit = 10) {
  const questions = readAllQuestions();
  
  const scored = questions.map(q => {
    let score = 0;
    if (!q.answer || q.answer.length < 20) score += 5;
    else if (q.answer.length > 300) score += 3;
    if (!q.explanation || q.explanation.length < 50) score += 4;
    else if (q.explanation && q.explanation.includes('[truncated')) score += 3;
    if (!q.diagram || q.diagram.length < 20) score += 3;
    if (!q.sourceUrl) score += 1;
    if (!q.videos || q.videos === '{}' || q.videos === 'null' || (Array.isArray(q.videos) && q.videos.length === 0)) score += 2;
    if (!q.companies || q.companies === '[]' || q.companies === 'null' || (Array.isArray(q.companies) && q.companies.length === 0)) score += 1;
    return { ...q, priority_score: score };
  });
  
  const filtered = scored.filter(q => 
    (!q.answer || q.answer.length < 20 || q.answer.length > 300) ||
    (!q.explanation || q.explanation.length < 50 || (q.explanation && q.explanation.includes('[truncated'))) ||
    (!q.diagram || q.diagram.length < 20) ||
    !q.sourceUrl ||
    (!q.videos || q.videos === '{}' || q.videos === 'null' || (Array.isArray(q.videos) && q.videos.length === 0)) ||
    (!q.companies || q.companies === '[]' || q.companies === 'null' || (Array.isArray(q.companies) && q.companies.length === 0))
  );
  
  filtered.sort((a, b) => {
    if (b.priority_score !== a.priority_score) return b.priority_score - a.priority_score;
    return (a.lastUpdated || '').localeCompare(b.lastUpdated || '');
  });
  
  return filtered.slice(0, limit);
}

// Get questions needing diagrams, sorted by priority
export async function getQuestionsNeedingDiagrams(limit = 10) {
  const questions = readAllQuestions();
  
  const scored = questions.map(q => {
    let score = 0;
    if (!q.diagram || q.diagram.length < 20) score += 3;
    else if (q.diagram && q.diagram.includes('Concept') && q.diagram.includes('Implementation') && q.diagram.length < 100) score += 2;
    else if (q.diagram && q.diagram.length < 50) score += 1;
    return { ...q, diagram_priority: score };
  });
  
  const filtered = scored.filter(q =>
    !q.diagram ||
    q.diagram.length < 20 ||
    (q.diagram && q.diagram.includes('Concept') && q.diagram.includes('Implementation') && q.diagram.length < 100)
  );
  
  filtered.sort((a, b) => {
    if (b.diagram_priority !== a.diagram_priority) return b.diagram_priority - a.diagram_priority;
    return (a.lastUpdated || '').localeCompare(b.lastUpdated || '');
  });
  
  return filtered.slice(0, limit);
}

// Get all unique channels from files
export async function getAllChannelsFromDb() {
  if (!fs.existsSync(QUESTIONS_DIR)) return [];
  return fs.readdirSync(QUESTIONS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace(/\.json$/, ''))
    .sort();
}

// Get channel statistics for balancing question distribution
export async function getChannelStats() {
  if (!fs.existsSync(QUESTIONS_DIR)) return [];
  
  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
  const stats = [];
  
  for (const f of files) {
    try {
      const channel = f.replace(/\.json$/, '');
      const questions = JSON.parse(fs.readFileSync(path.join(QUESTIONS_DIR, f), 'utf8'));
      
      let questionCount = 0;
      let missingDiagrams = 0;
      let missingExplanations = 0;
      let missingCompanies = 0;
      let oldestUpdate = null;
      
      for (const q of questions) {
        questionCount++;
        if (!q.diagram || q.diagram.length < 20) missingDiagrams++;
        if (!q.explanation || q.explanation.length < 50) missingExplanations++;
        if (!q.companies || q.companies === '[]' || (Array.isArray(q.companies) && q.companies.length === 0)) missingCompanies++;
        if (!oldestUpdate || q.lastUpdated < oldestUpdate) oldestUpdate = q.lastUpdated;
      }
      
      stats.push({
        channel,
        question_count: questionCount,
        missing_diagrams: missingDiagrams,
        missing_explanations: missingExplanations,
        missing_companies: missingCompanies,
        oldest_update: oldestUpdate
      });
    } catch {}
  }
  
  stats.sort((a, b) => a.question_count - b.question_count);
  return stats;
}

// Get channels with fewest questions (for balancing new question additions)
export async function getUnderservedChannels(minQuestions = 10) {
  const counts = await getChannelQuestionCounts();
  return Object.entries(counts)
    .filter(([, count]) => count < minQuestions)
    .map(([channel, count]) => ({ channel, count }))
    .sort((a, b) => a.count - b.count);
}

// Generate unique ID
export async function generateUnifiedId(prefix = 'q') {
  const questions = readAllQuestions();
  let maxNum = 0;
  const pattern = new RegExp(`^${prefix}-(\\d+)$`);
  for (const q of questions) {
    const m = (q.id || '').match(pattern);
    if (m) {
      const num = parseInt(m[1], 10);
      if (num > maxNum) maxNum = num;
    }
  }
  return `${prefix}-${maxNum + 1}`;
}

// Check if question is duplicate
export async function isDuplicateUnified(questionText, threshold = 0.6) {
  const questions = await getAllUnifiedQuestions();
  return questions.some(q => calculateSimilarity(questionText, q.question) >= threshold);
}

// ============================================
// YOUTUBE VIDEO VALIDATION
// ============================================

export function extractYouTubeVideoId(url) {
  if (!url) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

const BLOCKED_VIDEO_IDS = [
  'dQw4w9WgXcQ', 'oHg5SJYRHA0', 'xvFZjo5PgG0', 'DLzxrzFCyOs',
  'kJQP7kiw5Fk', '9bZkp7q19f0', 'jNQXAC9IVRw',
  'AAAAAAAAAA', 'BBBBBBBBBBB', 'CCCCCCCCCCC',
  'xxxxxxxxxxx', 'yyyyyyyyyyy', 'zzzzzzzzzzz',
  '12345678901', 'abcdefghijk',
];

export async function validateYouTubeVideo(url) {
  const videoId = extractYouTubeVideoId(url);
  if (!videoId) return { valid: false, reason: 'Invalid YouTube URL format' };
  
  if (BLOCKED_VIDEO_IDS.includes(videoId)) {
    return { valid: false, reason: 'Blocked: Known placeholder/meme video' };
  }
  
  return new Promise((resolve) => {
    const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
    
    const req = https.get(oembedUrl, { timeout: 5000 }, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const info = JSON.parse(data);
            resolve({ valid: true, videoId, title: info.title, author: info.author_name });
          } catch {
            resolve({ valid: true, videoId });
          }
        });
      } else {
        resolve({ valid: false, reason: `HTTP ${res.statusCode}` });
      }
    });
    
    req.on('error', () => resolve({ valid: false, reason: 'Network error' }));
    req.on('timeout', () => { req.destroy(); resolve({ valid: false, reason: 'Timeout' }); });
  });
}

function isVideoTitleRelevant(title) {
  if (!title) return true;
  const blockedPatterns = [
    /official\s*(music\s*)?video/i, /\(official\)/i, /music\s*video/i,
    /lyric\s*video/i, /lyrics/i, /ft\.|feat\./i, /rick\s*astley/i,
    /never\s*gonna\s*give/i, /despacito/i, /gangnam/i, /baby\s*shark/i, /vevo$/i,
  ];
  return !blockedPatterns.some(p => p.test(title));
}

export async function validateYouTubeVideos(videos) {
  if (!videos) return { shortVideo: null, longVideo: null };
  
  const result = { shortVideo: null, longVideo: null };
  
  if (videos.shortVideo) {
    const validation = await validateYouTubeVideo(videos.shortVideo);
    if (validation.valid && isVideoTitleRelevant(validation.title)) {
      result.shortVideo = videos.shortVideo;
      console.log(`  ✓ Short video valid: ${validation.title || videos.shortVideo}`);
    } else {
      console.log(`  ✗ Short video invalid: ${validation.reason || 'Non-educational'}`);
    }
  }
  
  if (videos.longVideo) {
    const validation = await validateYouTubeVideo(videos.longVideo);
    if (validation.valid && isVideoTitleRelevant(validation.title)) {
      result.longVideo = videos.longVideo;
      console.log(`  ✓ Long video valid: ${validation.title || videos.longVideo}`);
    } else {
      console.log(`  ✗ Long video invalid: ${validation.reason || 'Non-educational'}`);
    }
  }
  
  return result;
}

// ============================================
// COMPANY VALIDATION
// ============================================

const KNOWN_COMPANIES = new Set([
  'Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Netflix', 'Uber', 'Airbnb',
  'LinkedIn', 'Twitter', 'Stripe', 'Salesforce', 'Adobe', 'Oracle', 'IBM',
  'Spotify', 'Snap', 'Pinterest', 'Dropbox', 'Slack', 'Zoom', 'Shopify',
  'Square', 'PayPal', 'Intuit', 'VMware', 'Cisco', 'Intel', 'AMD', 'NVIDIA',
  'Tesla', 'SpaceX', 'Palantir', 'Databricks', 'Snowflake', 'MongoDB',
  'Coinbase', 'Robinhood', 'DoorDash', 'Instacart', 'Lyft', 'Reddit',
  'TikTok', 'ByteDance', 'Alibaba', 'Tencent', 'Baidu', 'Samsung',
  'Goldman Sachs', 'Morgan Stanley', 'JPMorgan', 'Bloomberg', 'Citadel',
  'Two Sigma', 'Jane Street', 'DE Shaw', 'Bridgewater', 'Visa', 'Mastercard'
]);

const COMPANY_ALIASES = {
  'facebook': 'Meta', 'fb': 'Meta', 'aws': 'Amazon',
  'msft': 'Microsoft', 'goog': 'Google', 'alphabet': 'Google',
  'x': 'Twitter', 'x.com': 'Twitter', 'openai': 'OpenAI', 'github': 'GitHub',
};

export function normalizeCompanies(companies) {
  if (!companies || !Array.isArray(companies)) return [];
  
  const normalized = new Set();
  companies.forEach(company => {
    if (!company || typeof company !== 'string') return;
    const trimmed = company.trim();
    const lower = trimmed.toLowerCase();
    
    if (COMPANY_ALIASES[lower]) {
      normalized.add(COMPANY_ALIASES[lower]);
      return;
    }
    
    for (const known of KNOWN_COMPANIES) {
      if (known.toLowerCase() === lower) {
        normalized.add(known);
        return;
      }
    }
    
    const capitalized = trimmed.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
    
    if (capitalized.length >= 2 && /^[A-Za-z0-9\s&.-]+$/.test(capitalized)) {
      normalized.add(capitalized);
    }
  });
  
  return Array.from(normalized).sort();
}

// ============================================
// TEXT PROCESSING
// ============================================

export function normalizeText(t) {
  return t.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
}

export function calculateSimilarity(text1, text2) {
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);
  const words1 = new Set(norm1.split(' '));
  const words2 = new Set(norm2.split(' '));
  const intersection = [...words1].filter(w => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;
  return union === 0 ? 0 : intersection / union;
}

export function isDuplicate(question, existing, threshold = 0.6) {
  return existing.some(e => calculateSimilarity(question, e.question) >= threshold);
}

// ============================================
// OPENCODE INTEGRATION
// ============================================

// Use free models from OpenCode (no auth required)
const OPENCODE_MODEL = process.env.OPENCODE_MODEL || 'opencode/big-pickle';

export function runOpenCode(prompt) {
  return new Promise((resolve) => {
    let output = '';
    let resolved = false;
    
    const proc = spawn('opencode', ['run', '--model', OPENCODE_MODEL, '--format', 'json', prompt], {
      timeout: TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    const timeout = setTimeout(() => {
      if (!resolved) { resolved = true; proc.kill('SIGTERM'); resolve(null); }
    }, TIMEOUT_MS);
    
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { output += data.toString(); });
    
    proc.on('close', () => {
      clearTimeout(timeout);
      if (!resolved) { resolved = true; resolve(output || null); }
    });
    
    proc.on('error', () => {
      clearTimeout(timeout);
      if (!resolved) { resolved = true; resolve(null); }
    });
  });
}

export async function runWithRetries(prompt) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`[Attempt ${attempt}/${MAX_RETRIES}] Calling OpenCode CLI...`);
    const result = await runOpenCode(prompt);
    if (result) return result;
    
    if (attempt < MAX_RETRIES) {
      console.log(`Failed. Waiting ${RETRY_DELAY_MS/1000}s before retry...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  return null;
}

// ============================================
// JSON PARSING
// ============================================

export function extractTextFromJsonEvents(output) {
  if (!output) return null;
  
  const lines = output.split('\n').filter(l => l.trim());
  let fullText = '';
  
  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'text' && event.part?.text) {
        fullText += event.part.text;
      }
    } catch {}
  }
  
  return fullText || output;
}

/**
 * Repair fragmented JSON where the AI generates multiple top-level objects
 * instead of properly nested arrays. Merges orphaned objects back into the
 * main structure based on their keys.
 */
function repairFragmentedJson(jsonText) {
  // Find all top-level objects
  let depth = 0, inStr = false, esc = false;
  const objects = [];
  let objStart = -1;

  for (let i = 0; i < jsonText.length; i++) {
    const c = jsonText[i];
    if (esc) { esc = false; continue; }
    if (inStr) { if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
    if (c === '"') inStr = true;
    else if (c === '{') { depth++; if (depth === 1) objStart = i; }
    else if (c === '}') { depth--; if (depth === 0 && objStart !== -1) { objects.push(jsonText.substring(objStart, i + 1)); objStart = -1; } }
  }

  if (objects.length <= 1) return jsonText;

  let main;
  try { main = JSON.parse(objects[0]); } catch { return jsonText; }

  for (let i = 1; i < objects.length; i++) {
    let obj;
    try { obj = JSON.parse(objects[i]); } catch { continue; }
    const keys = Object.keys(obj);

    if (keys.includes('heading') && keys.includes('content')) {
      if (!main.sections) main.sections = [];
      main.sections.push(obj);
    } else if (keys.includes('term') && keys.includes('definition')) {
      if (!main.glossary) main.glossary = [];
      main.glossary.push(obj);
    } else if (keys.includes('company') && keys.includes('scenario')) {
      if (!main.realWorldExample) main.realWorldExample = obj;
    } else if (keys.includes('title') && keys.includes('url') && keys.includes('type')) {
      if (!main.sources) main.sources = [];
      main.sources.push(obj);
    } else if (keys.includes('url') && keys.includes('alt')) {
      if (!main.diagramImages) main.diagramImages = [];
      main.diagramImages.push(obj);
    } else if (keys.includes('hook') && keys.includes('body')) {
      main.socialSnippet = obj;
    } else {
      Object.assign(main, obj);
    }
  }

  return JSON.stringify(main);
}

export function parseJson(response) {
  if (!response) return null;
  
  const text = extractTextFromJsonEvents(response);
  
  console.log('📥 RESPONSE (first 500 chars):');
  console.log(text.substring(0, 500));
  console.log('─'.repeat(30));
  
  try { return JSON.parse(text.trim()); } catch {}
  
  const codeBlockPatterns = [/```json\s*([\s\S]*?)\s*```/, /```\s*([\s\S]*?)\s*```/];
  for (const p of codeBlockPatterns) {
    const m = text.match(p);
    if (m) { try { return JSON.parse(m[1].trim()); } catch {} }
  }
  
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.substring(firstBrace, lastBrace + 1);
    try { return JSON.parse(candidate); } catch {}
    // Try repairing fragmented JSON (AI sometimes generates multiple top-level objects)
    try { return JSON.parse(repairFragmentedJson(candidate)); } catch {}
  }
  
  return null;
}

// ============================================
// VALIDATION
// ============================================

export function validateQuestion(data) {
  return data &&
    data.question?.length > 10 &&
    data.answer?.length > 5 &&
    data.explanation?.length > 20;
}

// ============================================
// GITHUB OUTPUT
// ============================================

export function writeGitHubOutput(data) {
  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    Object.entries(data).forEach(([key, value]) => {
      fs.appendFileSync(out, `${key}=${value}\n`);
    });
  }
}

// ============================================
// INDEX FILE (for backward compatibility)
// ============================================

export function updateUnifiedIndexFile() {
  console.log('📝 Index is file-based (data/questions/*.json)');
}

// ============================================
// CHANGELOG (stored in database or memory)
// ============================================

let changelogCache = null;

export function loadChangelog() {
  if (changelogCache) return changelogCache;
  return {
    entries: [],
    stats: { totalQuestionsAdded: 0, totalQuestionsImproved: 0, lastUpdated: new Date().toISOString() }
  };
}

export function saveChangelog(data) {
  changelogCache = data;
  changelogCache.stats.lastUpdated = new Date().toISOString();
}

export function addChangelogEntry(type, title, description, details = {}) {
  const changelog = loadChangelog();
  const entry = { date: new Date().toISOString().split('T')[0], type, title, description, details };
  changelog.entries.unshift(entry);
  if (details.questionsAdded) changelog.stats.totalQuestionsAdded += details.questionsAdded;
  if (details.questionsImproved) changelog.stats.totalQuestionsImproved += details.questionsImproved;
  if (changelog.entries.length > 100) changelog.entries = changelog.entries.slice(0, 100);
  saveChangelog(changelog);
  return entry;
}

export function logQuestionsAdded(count, channels, questionIds = []) {
  if (count === 0) return;
  return addChangelogEntry('added', `${count} New Questions Added`,
    `Daily AI-powered question generation added ${count} new questions across ${[...new Set(channels)].length} channels.`,
    { questionsAdded: count, channels: [...new Set(channels)], questionIds: questionIds.slice(0, 10) });
}

export function logQuestionsImproved(count, channels, questionIds = []) {
  if (count === 0) return;
  return addChangelogEntry('improved', `${count} Questions Improved`,
    `AI-powered improvement bot enhanced ${count} questions with better explanations and diagrams.`,
    { questionsImproved: count, channels: [...new Set(channels)], questionIds: questionIds.slice(0, 10) });
}

// ============================================
// WORK QUEUE OPERATIONS
// ============================================

function ensureBotDataDir() {
  if (!fs.existsSync(BOT_DATA_DIR)) {
    fs.mkdirSync(BOT_DATA_DIR, { recursive: true });
  }
}

// Initialize work queue file
export async function initWorkQueue() {
  if (_workQueueInitialized) return;
  ensureBotDataDir();
  if (!fs.existsSync(WORK_QUEUE_FILE)) {
    writeJsonFile(WORK_QUEUE_FILE, []);
  }
  _workQueueInitialized = true;
}

// Add work item to queue (avoids duplicates for same question+bot)
export async function addWorkItem(questionId, botType, reason, createdBy, priority = 5) {
  await initWorkQueue();
  
  const items = readJsonFile(WORK_QUEUE_FILE) || [];
  const existing = items.find(item => item.question_id === questionId && item.bot_type === botType && item.status === 'pending');
  
  if (existing) {
    console.log(`  ℹ️ Work item already exists for ${questionId} -> ${botType}`);
    return existing.id;
  }
  
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const item = {
    id,
    question_id: questionId,
    bot_type: botType,
    priority,
    status: 'pending',
    reason,
    created_by: createdBy,
    created_at: new Date().toISOString(),
    started_at: null,
    completed_at: null,
    result: null
  };
  
  items.push(item);
  writeJsonFile(WORK_QUEUE_FILE, items);
  
  console.log(`  📋 Created work item: ${questionId} -> ${botType} (${reason})`);
  return id;
}

// Get pending work items for a specific bot type
export async function getPendingWork(botType, limit = 10) {
  await initWorkQueue();
  
  const items = readJsonFile(WORK_QUEUE_FILE) || [];
  const pending = items
    .filter(item => item.bot_type === botType && item.status === 'pending')
    .sort((a, b) => a.priority - b.priority || (a.created_at || '').localeCompare(b.created_at || ''))
    .slice(0, limit);
  
  return pending.map(item => {
    const q = findQuestionById(item.question_id);
    return {
      workId: item.id,
      questionId: item.question_id,
      reason: item.reason,
      priority: item.priority,
      createdBy: item.created_by,
      createdAt: item.created_at,
      question: q || {
        id: item.question_id,
        question: item.question_id,
        answer: '',
        explanation: '',
        channel: null,
        subChannel: null,
        tags: [],
        videos: null,
        companies: null,
        diagram: null,
        eli5: null,
        difficulty: 'intermediate',
        sourceUrl: null,
        lastUpdated: null,
        createdAt: null
      }
    };
  });
}

// Mark work item as started
export async function startWorkItem(workId) {
  const items = readJsonFile(WORK_QUEUE_FILE) || [];
  const item = items.find(i => i.id === workId);
  if (item) {
    item.status = 'processing';
    item.started_at = new Date().toISOString();
    writeJsonFile(WORK_QUEUE_FILE, items);
  }
}

// Mark work item as completed
export async function completeWorkItem(workId, result = null) {
  const items = readJsonFile(WORK_QUEUE_FILE) || [];
  const item = items.find(i => i.id === workId);
  if (item) {
    item.status = 'completed';
    item.completed_at = new Date().toISOString();
    item.result = result ? JSON.stringify(result) : null;
    writeJsonFile(WORK_QUEUE_FILE, items);
  }
}

// Mark work item as failed
export async function failWorkItem(workId, error) {
  const items = readJsonFile(WORK_QUEUE_FILE) || [];
  const item = items.find(i => i.id === workId);
  if (item) {
    item.status = 'failed';
    item.completed_at = new Date().toISOString();
    item.result = JSON.stringify({ error });
    writeJsonFile(WORK_QUEUE_FILE, items);
  }
}

// Get work queue stats
export async function getWorkQueueStats() {
  const items = readJsonFile(WORK_QUEUE_FILE) || [];
  const stats = {};
  for (const item of items) {
    if (!stats[item.bot_type]) stats[item.bot_type] = {};
    if (!stats[item.bot_type][item.status]) stats[item.bot_type][item.status] = 0;
    stats[item.bot_type][item.status]++;
  }
  return stats;
}

// Clean up old completed/failed work items (older than 7 days)
export async function cleanupWorkQueue(daysOld = 7) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - daysOld);
  
  const items = readJsonFile(WORK_QUEUE_FILE) || [];
  const before = items.length;
  const filtered = items.filter(item =>
    !(item.status === 'completed' || item.status === 'failed') ||
    !item.completed_at ||
    item.completed_at >= cutoff.toISOString()
  );
  
  writeJsonFile(WORK_QUEUE_FILE, filtered);
  return before - filtered.length;
}

// ============================================
// BOT ACTIVITY LOGGING
// ============================================

// Log a bot activity
export async function logBotActivity(questionId, botType, action, status = 'completed', result = null) {
  ensureBotDataDir();
  
  const activities = readJsonFile(BOT_ACTIVITY_FILE) || [];
  
  const entry = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    question_id: questionId,
    bot_type: botType,
    action,
    status,
    result: result ? JSON.stringify(result) : null,
    created_at: new Date().toISOString(),
    completed_at: new Date().toISOString()
  };
  
  activities.push(entry);
  writeJsonFile(BOT_ACTIVITY_FILE, activities);
  
  console.log(`  📊 Logged activity: ${botType} -> ${questionId} (${action})`);
}

// Get recent bot activity
export async function getRecentBotActivity(limit = 50, botType = null) {
  let activities = readJsonFile(BOT_ACTIVITY_FILE) || [];
  
  if (botType) {
    activities = activities.filter(a => a.bot_type === botType);
  }
  
  activities.sort((a, b) => (b.completed_at || '').localeCompare(a.completed_at || ''));
  
  return activities.slice(0, limit).map(row => ({
    id: row.id,
    questionId: row.question_id,
    botType: row.bot_type,
    action: row.action,
    status: row.status,
    result: row.result ? JSON.parse(row.result) : null,
    completedAt: row.completed_at,
    questionText: null,
    channel: null
  }));
}


// ============================================
// OPTIMIZED QUERIES FOR BOTS
// ============================================

// Get questions needing ELI5 explanations
export async function getQuestionsNeedingEli5(limit = 100) {
  const questions = readAllQuestions();
  const filtered = questions.filter(q => !q.eli5 || q.eli5.length < 50);
  filtered.sort((a, b) => (a.lastUpdated || '').localeCompare(b.lastUpdated || ''));
  return filtered.slice(0, limit);
}

// Get questions needing TLDR summaries
export async function getQuestionsNeedingTldr(limit = 100) {
  const questions = readAllQuestions();
  const filtered = questions.filter(q => !q.tldr || q.tldr.length < 20);
  filtered.sort((a, b) => (a.lastUpdated || '').localeCompare(b.lastUpdated || ''));
  return filtered.slice(0, limit);
}

// Get questions needing company data
export async function getQuestionsNeedingCompanies(limit = 100, minCompanies = 3) {
  const questions = readAllQuestions();
  const filtered = questions.filter(q => {
    if (!q.companies || q.companies === '[]' || q.companies === 'null') return true;
    const companies = Array.isArray(q.companies) ? q.companies : [];
    return companies.length < minCompanies;
  });
  filtered.sort((a, b) => (a.lastUpdated || '').localeCompare(b.lastUpdated || ''));
  return filtered.slice(0, limit);
}

// ============================================
// CIRCUIT BREAKER FOR OPENCODE CLI
// ============================================

let _consecutiveFailures = 0;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_RESET_MS = 300000; // 5 minutes
let _circuitBreakerOpenedAt = null;

// Check if circuit breaker is open
export function isCircuitBreakerOpen() {
  if (_consecutiveFailures < CIRCUIT_BREAKER_THRESHOLD) return false;
  
  // Check if enough time has passed to reset
  if (_circuitBreakerOpenedAt && Date.now() - _circuitBreakerOpenedAt > CIRCUIT_BREAKER_RESET_MS) {
    console.log('🔄 Circuit breaker reset after cooldown');
    _consecutiveFailures = 0;
    _circuitBreakerOpenedAt = null;
    return false;
  }
  
  return true;
}

// Run OpenCode with circuit breaker protection
export async function runWithCircuitBreaker(prompt) {
  if (isCircuitBreakerOpen()) {
    console.log('⚠️ Circuit breaker OPEN - skipping API call to prevent cascade failures');
    return null;
  }
  
  const result = await runWithRetries(prompt);
  
  if (result) {
    _consecutiveFailures = 0;
    _circuitBreakerOpenedAt = null;
  } else {
    _consecutiveFailures++;
    if (_consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      _circuitBreakerOpenedAt = Date.now();
      console.log(`🔴 Circuit breaker OPENED after ${_consecutiveFailures} consecutive failures`);
    }
  }
  
  return result;
}

// Reset circuit breaker manually
export function resetCircuitBreaker() {
  _consecutiveFailures = 0;
  _circuitBreakerOpenedAt = null;
}

// ============================================
// BASE BOT RUNNER CLASS
// ============================================

/**
 * BaseBotRunner - Reusable base class for all bots
 * Handles common patterns: state management, work queue, rate limiting, batch processing
 */
export class BaseBotRunner {
  constructor(botName, options = {}) {
    this.botName = botName;
    this.batchSize = parseInt(process.env.BATCH_SIZE || options.defaultBatchSize || '100', 10);
    this.rateLimitMs = options.rateLimitMs || 2000;
    this.useWorkQueue = process.env.USE_WORK_QUEUE !== 'false';
    this.workQueueBotType = options.workQueueBotType || botName;
    this.results = {
      processed: 0,
      succeeded: 0,
      skipped: 0,
      failed: 0
    };
  }

  // Load bot state from file
  async loadState() {
    try {
      const stateFile = path.join(BOT_DATA_DIR, `bot-state-${this.botName}.json`);
      const data = readJsonFile(stateFile);
      if (data) return data;
    } catch {}
    return this.getDefaultState();
  }

  // Override in subclass to provide default state
  getDefaultState() {
    return {
      lastProcessedIndex: 0,
      lastRunDate: null,
      totalProcessed: 0
    };
  }

  // Save bot state to file
  async saveState(state) {
    state.lastRunDate = new Date().toISOString();
    try {
      ensureBotDataDir();
      const stateFile = path.join(BOT_DATA_DIR, `bot-state-${this.botName}.json`);
      writeJsonFile(stateFile, state);
    } catch (e) {
      console.error('Failed to save state:', e.message);
    }
  }

  // Rate limiting helper
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms || this.rateLimitMs));
  }

  // Get batch from work queue or fallback query
  async getBatch(state, fallbackQuery = null) {
    await initWorkQueue();
    
    // First try work queue
    if (this.useWorkQueue) {
      console.log(`📋 Checking work queue for ${this.workQueueBotType} tasks...`);
      const workItems = await getPendingWork(this.workQueueBotType, this.batchSize);
      if (workItems.length > 0) {
        console.log(`📦 Found ${workItems.length} tasks in work queue\n`);
        return {
          items: workItems.map(w => ({ 
            ...w.question, 
            workId: w.workId, 
            workReason: w.reason 
          })),
          fromWorkQueue: true
        };
      }
    }
    
    // Fallback to custom query or sequential processing
    if (fallbackQuery) {
      console.log('🔍 Using fallback query...');
      const items = await fallbackQuery(this.batchSize);
      console.log(`📦 Found ${items.length} items from fallback query\n`);
      return { items, fromWorkQueue: false };
    }
    
    // Default: get all questions and process sequentially
    console.log('📊 Using sequential processing...');
    const allQuestions = await getAllUnifiedQuestions();
    const sorted = [...allQuestions].sort((a, b) => {
      const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
      return numA - numB;
    });
    
    let startIndex = state.lastProcessedIndex || 0;
    if (startIndex >= sorted.length) {
      startIndex = 0;
      console.log('🔄 Wrapped around to beginning\n');
    }
    
    const endIndex = Math.min(startIndex + this.batchSize, sorted.length);
    const items = sorted.slice(startIndex, endIndex);
    
    console.log(`📦 Processing questions ${startIndex + 1} to ${endIndex} of ${sorted.length}\n`);
    
    return { 
      items, 
      fromWorkQueue: false, 
      startIndex, 
      endIndex, 
      totalCount: sorted.length 
    };
  }

  // Process a single item - override in subclass
  async processItem(item, index, total) {
    throw new Error('processItem must be implemented by subclass');
  }

  // Check if item needs processing - override in subclass
  needsProcessing(item) {
    return { needs: true, reason: 'default' };
  }

  // Main run method
  async run(options = {}) {
    const { fallbackQuery, onComplete } = options;
    
    console.log(`=== ${this.getEmoji()} ${this.getDisplayName()} ===\n`);
    
    await initWorkQueue();
    const state = await this.loadState();
    
    console.log(`📊 Bot: ${this.botName}`);
    console.log(`📅 Last run: ${state.lastRunDate || 'Never'}`);
    console.log(`⚙️ Batch size: ${this.batchSize}\n`);
    
    const batch = await this.getBatch(state, fallbackQuery);
    const { items, fromWorkQueue, startIndex, endIndex, totalCount } = batch;
    
    if (items.length === 0) {
      console.log('✅ No items to process!');
      writeGitHubOutput({ processed: 0, ...this.results });
      return this.results;
    }
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const workId = item.workId;
      
      console.log(`\n--- [${i + 1}/${items.length}] ${item.id} ---`);
      console.log(`Q: ${item.question?.substring(0, 60) || 'N/A'}...`);
      if (workId) console.log(`Work ID: ${workId} (${item.workReason})`);
      
      // Mark work as started
      if (workId) await startWorkItem(workId);
      
      // Check if needs processing
      const check = this.needsProcessing(item);
      if (!check.needs) {
        console.log(`✅ Skipping: ${check.reason}`);
        if (workId) await completeWorkItem(workId, { status: 'skipped', reason: check.reason });
        this.results.skipped++;
        this.results.processed++;
        continue;
      }
      
      // Rate limiting (skip for first item)
      if (i > 0) await this.sleep();
      
      try {
        const success = await this.processItem(item, i, items.length);
        
        if (success) {
          if (workId) await completeWorkItem(workId, { status: 'success' });
          this.results.succeeded++;
        } else {
          if (workId) await failWorkItem(workId, 'Processing failed');
          this.results.failed++;
        }
      } catch (error) {
        console.log(`❌ Error: ${error.message}`);
        if (workId) await failWorkItem(workId, error.message);
        this.results.failed++;
      }
      
      this.results.processed++;
      
      // Update state after each item (for non-work-queue mode)
      if (!fromWorkQueue && startIndex !== undefined) {
        await this.saveState({
          ...state,
          lastProcessedIndex: startIndex + i + 1,
          totalProcessed: (state.totalProcessed || 0) + 1
        });
      }
    }
    
    // Final state update
    const newState = {
      ...state,
      lastProcessedIndex: fromWorkQueue ? state.lastProcessedIndex : 
        (endIndex >= totalCount ? 0 : endIndex),
      lastRunDate: new Date().toISOString(),
      totalProcessed: (state.totalProcessed || 0) + this.results.processed
    };
    await this.saveState(newState);
    
    // Summary
    this.printSummary(newState);
    
    // Custom completion handler
    if (onComplete) await onComplete(this.results, newState);
    
    writeGitHubOutput({
      processed: this.results.processed,
      succeeded: this.results.succeeded,
      skipped: this.results.skipped,
      failed: this.results.failed,
      next_index: newState.lastProcessedIndex
    });
    
    return this.results;
  }

  // Override for custom emoji
  getEmoji() {
    return '🤖';
  }

  // Override for custom display name
  getDisplayName() {
    return this.botName;
  }

  // Print summary
  printSummary(state) {
    console.log('\n\n=== SUMMARY ===');
    console.log(`Processed: ${this.results.processed}`);
    console.log(`Succeeded: ${this.results.succeeded}`);
    console.log(`Skipped: ${this.results.skipped}`);
    console.log(`Failed: ${this.results.failed}`);
    if (state.lastProcessedIndex !== undefined) {
      console.log(`\nNext run starts at: ${state.lastProcessedIndex}`);
    }
    console.log('=== END ===\n');
  }
}

// ============================================
// GISCUS/GITHUB DISCUSSIONS INTEGRATION
// ============================================

// Get repo info from environment or use defaults
const GITHUB_REPO_OWNER = process.env.GITHUB_REPOSITORY?.split('/')[0] || 'satishkumar-dhule';
const GITHUB_REPO_NAME = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'code-reels';
const GISCUS_CATEGORY_ID = process.env.GISCUS_CATEGORY_ID || 'DIC_kwDOQmWh684C0ESo'; // General category

/**
 * Post a comment to GitHub Discussions for a specific question
 * Uses the GitHub GraphQL API to create or find discussions and add comments
 * 
 * @param {string} questionId - The question ID (used as discussion term)
 * @param {string} botName - Name of the bot making the change
 * @param {string} changeType - Type of change (e.g., 'improved', 'diagram_added', 'companies_added')
 * @param {object} details - Details about the change
 * @returns {Promise<boolean>} - Whether the comment was posted successfully
 */
export async function postBotCommentToDiscussion(questionId, botName, changeType, details = {}) {
  const token = process.env.GITHUB_TOKEN;
  
  if (!token) {
    console.log('  ⚠️ GITHUB_TOKEN not set, skipping discussion comment');
    return false;
  }
  
  try {
    // Format the comment body
    const commentBody = formatBotComment(botName, changeType, details);
    
    // First, try to find existing discussion for this question
    const discussionId = await findOrCreateDiscussion(token, questionId);
    
    if (!discussionId) {
      console.log(`  ⚠️ Could not find/create discussion for ${questionId}`);
      return false;
    }
    
    // Add comment to the discussion
    const success = await addCommentToDiscussion(token, discussionId, commentBody);
    
    if (success) {
      console.log(`  💬 Posted bot comment to discussion for ${questionId}`);
    }
    
    return success;
  } catch (error) {
    console.error(`  ❌ Failed to post discussion comment: ${error.message}`);
    return false;
  }
}

/**
 * Format a bot comment for GitHub Discussions - Clean & Minimal
 */
function formatBotComment(botName, changeType, details) {
  const emoji = getBotEmoji(changeType);
  const date = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  
  // Simple one-line format for most updates
  let body = `${emoji} **${formatChangeType(changeType)}** — ${date}\n\n`;
  
  if (details.summary) {
    body += `${details.summary}\n`;
  }
  
  // Only show changes if there are meaningful ones
  if (details.changes && details.changes.length > 0) {
    const meaningfulChanges = details.changes.filter(c => c && c.length > 0);
    if (meaningfulChanges.length > 0 && meaningfulChanges.length <= 3) {
      body += '\n';
      meaningfulChanges.forEach(change => {
        body += `• ${change}\n`;
      });
    }
  }
  
  // Collapsible diff only for significant changes
  if (details.before && details.after && details.before !== details.after) {
    const beforePreview = truncateText(details.before, 100);
    const afterPreview = truncateText(details.after, 100);
    if (beforePreview !== afterPreview) {
      body += `\n<details><summary>View diff</summary>\n\n`;
      body += `\`\`\`diff\n- ${truncateText(details.before, 200)}\n+ ${truncateText(details.after, 200)}\n\`\`\`\n</details>`;
    }
  }
  
  return body.trim();
}

function getBotEmoji(changeType) {
  const emojis = {
    'improved': '✨',
    'diagram_added': '📊',
    'diagram_updated': '📊',
    'companies_added': '🏢',
    'videos_added': '🎬',
    'eli5_added': '👶',
    'tldr_added': '📝',
    'relevance_scored': '🎯',
    'generated': '🤖',
    'remapped': '🔄',
    'classified': '🏷️',
  };
  return emojis[changeType] || '🔧';
}

function formatChangeType(changeType) {
  const labels = {
    'improved': 'Question Improved',
    'diagram_added': 'Diagram Added',
    'diagram_updated': 'Diagram Updated',
    'companies_added': 'Companies Added',
    'videos_added': 'Videos Added',
    'eli5_added': 'ELI5 Explanation Added',
    'tldr_added': 'TL;DR Added',
    'relevance_scored': 'Relevance Scored',
    'generated': 'Question Generated',
    'remapped': 'Question Remapped',
    'classified': 'Question Classified',
  };
  return labels[changeType] || changeType;
}

function truncateText(text, maxLength) {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}

/**
 * Find existing discussion or create a new one for a question
 */
async function findOrCreateDiscussion(token, questionId) {
  // First, try to find existing discussion
  const searchQuery = `
    query {
      repository(owner: "${GITHUB_REPO_OWNER}", name: "${GITHUB_REPO_NAME}") {
        discussions(first: 1, categoryId: "${GISCUS_CATEGORY_ID}") {
          nodes {
            id
            title
          }
        }
      }
    }
  `;
  
  // Search for discussion with matching title (Giscus uses questionId as title)
  const findQuery = `
    query {
      search(query: "repo:${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME} ${questionId} in:title", type: DISCUSSION, first: 5) {
        nodes {
          ... on Discussion {
            id
            title
          }
        }
      }
    }
  `;
  
  const searchResult = await graphqlRequest(token, findQuery);
  
  if (searchResult?.data?.search?.nodes) {
    const matching = searchResult.data.search.nodes.find(d => 
      d.title === questionId || d.title?.includes(questionId)
    );
    if (matching) {
      return matching.id;
    }
  }
  
  // If no existing discussion, create one
  // First get the repository ID and category ID
  const repoQuery = `
    query {
      repository(owner: "${GITHUB_REPO_OWNER}", name: "${GITHUB_REPO_NAME}") {
        id
        discussionCategories(first: 10) {
          nodes {
            id
            name
          }
        }
      }
    }
  `;
  
  const repoResult = await graphqlRequest(token, repoQuery);
  
  if (!repoResult?.data?.repository?.id) {
    console.log('  ⚠️ Could not get repository ID');
    return null;
  }
  
  const repoId = repoResult.data.repository.id;
  const generalCategory = repoResult.data.repository.discussionCategories.nodes.find(
    c => c.name === 'General'
  );
  
  if (!generalCategory) {
    console.log('  ⚠️ Could not find General category');
    return null;
  }
  
  // Create new discussion
  const createMutation = `
    mutation {
      createDiscussion(input: {
        repositoryId: "${repoId}",
        categoryId: "${generalCategory.id}",
        title: "${questionId}",
        body: "Discussion thread for question **${questionId}**\\n\\nThis discussion was automatically created for tracking bot updates and user comments."
      }) {
        discussion {
          id
        }
      }
    }
  `;
  
  const createResult = await graphqlRequest(token, createMutation);
  
  return createResult?.data?.createDiscussion?.discussion?.id || null;
}

/**
 * Add a comment to an existing discussion
 */
async function addCommentToDiscussion(token, discussionId, body) {
  const mutation = `
    mutation {
      addDiscussionComment(input: {
        discussionId: "${discussionId}",
        body: ${JSON.stringify(body)}
      }) {
        comment {
          id
        }
      }
    }
  `;
  
  const result = await graphqlRequest(token, mutation);
  return !!result?.data?.addDiscussionComment?.comment?.id;
}

/**
 * Make a GraphQL request to GitHub API
 */
async function graphqlRequest(token, query) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ query });
    
    const options = {
      hostname: 'api.github.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'open-interview-bot'
      }
    };
    
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.errors) {
            console.log('  ⚠️ GraphQL errors:', parsed.errors.map(e => e.message).join(', '));
          }
          resolve(parsed);
        } catch (e) {
          console.log('  ⚠️ Failed to parse GraphQL response');
          resolve(null);
        }
      });
    });
    
    req.on('error', (e) => {
      console.log(`  ⚠️ GraphQL request error: ${e.message}`);
      resolve(null);
    });
    
    req.write(postData);
    req.end();
  });
}

