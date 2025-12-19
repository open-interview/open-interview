/**
 * Coding Challenge Generator Bot
 * Generates coding challenges using OpenCode CLI (same pattern as other bots)
 * 
 * Usage:
 *   node script/coding-challenge-bot.js
 * 
 * Environment variables:
 *   INPUT_DIFFICULTY - 'easy', 'medium', or 'random' (default: random)
 *   INPUT_CATEGORY - specific category or 'random' (default: random)
 *   INPUT_COUNT - number of challenges to generate (default: 1)
 */

import { runWithRetries, parseJson, writeGitHubOutput } from './utils.js';
import { writeFileSync } from 'fs';

const CATEGORIES = [
  'arrays',
  'strings', 
  'hash-maps',
  'two-pointers',
  'stacks',
  'math',
  'sorting',
  'searching',
  'dynamic-programming',
  'linked-lists',
];

const DIFFICULTIES = ['easy', 'medium'];

// Top tech companies known for coding interviews
const TOP_COMPANIES = [
  'Google', 'Amazon', 'Meta', 'Apple', 'Microsoft', 'Netflix',
  'Uber', 'Lyft', 'Airbnb', 'Stripe', 'Square', 'PayPal',
  'LinkedIn', 'Twitter', 'Snap', 'Pinterest', 'Dropbox',
  'Salesforce', 'Adobe', 'Oracle', 'Nvidia', 'Intel',
  'Bloomberg', 'Goldman Sachs', 'Morgan Stanley', 'Citadel', 'Two Sigma',
  'Databricks', 'Snowflake', 'Confluent', 'MongoDB', 'Elastic',
  'Shopify', 'DoorDash', 'Instacart', 'Coinbase', 'Robinhood',
  'Palantir', 'SpaceX', 'Tesla', 'OpenAI', 'Anthropic',
];

// Get 2-4 random companies
function getRandomCompanies() {
  const count = Math.floor(Math.random() * 3) + 2; // 2-4 companies
  const shuffled = [...TOP_COMPANIES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const SYSTEM_PROMPT = `You are an expert coding interview question creator for a LeetCode-style platform.

CRITICAL RULES:
1. Generate problems solvable in 10-20 minutes
2. Test case inputs/outputs MUST be valid JSON (arrays as [1,2,3], strings as "hello", booleans as true/false)
3. Function names should be camelCase for JS (twoSum) and snake_case for Python (two_sum)
4. Include 3-4 test cases covering normal cases AND edge cases
5. Solutions must be CORRECT and produce exact expected outputs
6. Starter code has function signature only with "// Your code here" comment

OUTPUT: Return ONLY valid JSON (no markdown, no explanation):`;

function buildPrompt(difficulty, category, companies) {
  return `${SYSTEM_PROMPT}

Generate a ${difficulty} coding challenge for category: ${category}
This type of question is commonly asked at: ${companies.join(', ')}

Requirements:
- Difficulty: ${difficulty} (${difficulty === 'easy' ? 'basic concepts, 10 min solve time' : 'requires thinking, 15-20 min solve time'})
- Category: ${category}
- 3-4 test cases with edge cases
- Working solutions in both JavaScript and Python
- Include the companies where this question is asked

Return this exact JSON structure:
{
  "title": "Problem Title Here",
  "description": "Clear problem description. Given X, return Y. Include constraints.",
  "difficulty": "${difficulty}",
  "category": "${category}",
  "tags": ["${category}", "tag2", "tag3"],
  "companies": ${JSON.stringify(companies)},
  "starterCode": {
    "javascript": "function solutionName(param) {\\n  // Your code here\\n  \\n}",
    "python": "def solution_name(param):\\n    # Your code here\\n    pass"
  },
  "testCases": [
    {"id": "1", "input": "[1,2,3]", "expectedOutput": "6", "description": "Basic case"},
    {"id": "2", "input": "[]", "expectedOutput": "0", "description": "Empty array"},
    {"id": "3", "input": "[5]", "expectedOutput": "5", "description": "Single element"}
  ],
  "hints": [
    "Think about the simplest approach first",
    "Consider using X data structure",
    "The optimal solution uses Y technique"
  ],
  "sampleSolution": {
    "javascript": "function solutionName(param) {\\n  // working solution\\n  return result;\\n}",
    "python": "def solution_name(param):\\n    # working solution\\n    return result"
  },
  "complexity": {
    "time": "O(n)",
    "space": "O(1)",
    "explanation": "Brief explanation of why"
  },
  "timeLimit": ${difficulty === 'easy' ? 10 : 15}
}`;
}

function validateChallenge(data) {
  if (!data) return false;
  
  const required = ['title', 'description', 'difficulty', 'starterCode', 'testCases', 'sampleSolution', 'complexity'];
  for (const field of required) {
    if (!data[field]) {
      console.log(`❌ Missing required field: ${field}`);
      return false;
    }
  }
  
  if (!data.starterCode.javascript || !data.starterCode.python) {
    console.log('❌ Missing starter code for JS or Python');
    return false;
  }
  
  if (!data.sampleSolution.javascript || !data.sampleSolution.python) {
    console.log('❌ Missing sample solution for JS or Python');
    return false;
  }
  
  if (!Array.isArray(data.testCases) || data.testCases.length < 2) {
    console.log('❌ Need at least 2 test cases');
    return false;
  }
  
  // Validate test cases have required fields
  for (const tc of data.testCases) {
    if (!tc.input || tc.expectedOutput === undefined) {
      console.log('❌ Test case missing input or expectedOutput');
      return false;
    }
  }
  
  return true;
}


async function generateChallenge(difficulty, category) {
  const companies = getRandomCompanies();
  console.log(`\n🎯 Generating ${difficulty} challenge for ${category}...`);
  console.log(`🏢 Target companies: ${companies.join(', ')}`);
  
  const prompt = buildPrompt(difficulty, category, companies);
  
  console.log('\n📝 Prompt sent to OpenCode');
  console.log('─'.repeat(50));
  
  const response = await runWithRetries(prompt);
  
  if (!response) {
    console.log('❌ OpenCode failed after all retries');
    return null;
  }
  
  const data = parseJson(response);
  
  if (!validateChallenge(data)) {
    console.log('❌ Invalid challenge format');
    return null;
  }
  
  // Ensure test case IDs
  data.testCases = data.testCases.map((tc, i) => ({
    ...tc,
    id: tc.id || String(i + 1),
  }));
  
  // Ensure tags array
  if (!Array.isArray(data.tags)) {
    data.tags = [category];
  }
  
  // Ensure hints array
  if (!Array.isArray(data.hints)) {
    data.hints = ['Think about the problem step by step'];
  }
  
  // Ensure companies array
  if (!Array.isArray(data.companies)) {
    data.companies = companies;
  }
  
  return data;
}

async function main() {
  console.log('=== 🤖 Coding Challenge Generator Bot ===\n');
  
  const inputDifficulty = process.env.INPUT_DIFFICULTY || 'random';
  const inputCategory = process.env.INPUT_CATEGORY || 'random';
  const inputCount = parseInt(process.env.INPUT_COUNT || '1', 10);
  
  console.log(`Configuration:`);
  console.log(`  Difficulty: ${inputDifficulty}`);
  console.log(`  Category: ${inputCategory}`);
  console.log(`  Count: ${inputCount}`);
  
  const generated = [];
  const failed = [];
  
  for (let i = 0; i < inputCount; i++) {
    console.log(`\n--- Challenge ${i + 1}/${inputCount} ---`);
    
    const difficulty = inputDifficulty === 'random'
      ? DIFFICULTIES[Math.floor(Math.random() * DIFFICULTIES.length)]
      : inputDifficulty;
    
    const category = inputCategory === 'random'
      ? CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
      : inputCategory;
    
    const challenge = await generateChallenge(difficulty, category);
    
    if (challenge) {
      generated.push(challenge);
      console.log(`✅ Generated: ${challenge.title}`);
      console.log(`   Difficulty: ${challenge.difficulty}`);
      console.log(`   Category: ${challenge.category}`);
      console.log(`   Companies: ${challenge.companies?.join(', ') || 'N/A'}`);
      console.log(`   Test cases: ${challenge.testCases.length}`);
    } else {
      failed.push({ difficulty, category, reason: 'Generation failed' });
    }
  }
  
  // Save generated challenges to file
  if (generated.length > 0) {
    const outputFile = `generated_coding_challenges_${Date.now()}.json`;
    writeFileSync(outputFile, JSON.stringify(generated, null, 2));
    console.log(`\n📁 Saved ${generated.length} challenges to ${outputFile}`);
    
    // Also save the latest single challenge for easy access
    if (generated.length === 1) {
      writeFileSync('generated_coding_challenge.json', JSON.stringify(generated[0], null, 2));
      console.log('📁 Also saved to generated_coding_challenge.json');
    }
  }
  
  // Summary
  console.log('\n=== SUMMARY ===');
  console.log(`Generated: ${generated.length}/${inputCount}`);
  console.log(`Failed: ${failed.length}`);
  
  if (generated.length > 0) {
    console.log('\n✅ Generated Challenges:');
    generated.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.title} (${c.difficulty}, ${c.category})`);
    });
  }
  
  if (failed.length > 0) {
    console.log('\n❌ Failed:');
    failed.forEach(f => console.log(`  - ${f.category} (${f.difficulty}): ${f.reason}`));
  }
  
  writeGitHubOutput({
    generated_count: generated.length,
    failed_count: failed.length,
  });
}

main().catch(e => {
  console.error('Fatal error:', e);
  process.exit(1);
});
