/**
 * Test Job Title Relevance Calculation
 * Verifies the relevance scoring algorithm works correctly
 */

import jobTitleService from './ai/services/job-title-relevance.js';

// Test questions with expected outcomes
const testQuestions = [
  {
    id: 'test-1',
    channel: 'react',
    subChannel: 'hooks',
    question: 'Explain how React hooks work and when to use useState vs useEffect',
    answer: 'React hooks allow functional components to use state and lifecycle features...',
    difficulty: 'intermediate',
    tags: ['react', 'hooks', 'frontend'],
    expectedTop: ['frontend-engineer', 'fullstack-engineer']
  },
  {
    id: 'test-2',
    channel: 'kubernetes',
    subChannel: 'deployment',
    question: 'How do you perform a rolling deployment in Kubernetes?',
    answer: 'Rolling deployments in Kubernetes update pods gradually using deployment strategies...',
    difficulty: 'advanced',
    tags: ['kubernetes', 'deployment', 'orchestration'],
    expectedTop: ['devops-engineer', 'sre', 'cloud-architect']
  },
  {
    id: 'test-3',
    channel: 'sql',
    subChannel: 'optimization',
    question: 'Explain how to optimize a slow SQL query with multiple joins',
    answer: 'Query optimization involves analyzing execution plans, adding indexes, and restructuring joins...',
    difficulty: 'intermediate',
    tags: ['sql', 'database', 'performance'],
    expectedTop: ['backend-engineer', 'data-engineer', 'fullstack-engineer']
  },
  {
    id: 'test-4',
    channel: 'machine-learning',
    subChannel: 'model-training',
    question: 'What is overfitting and how do you prevent it in ML models?',
    answer: 'Overfitting occurs when a model learns training data too well, including noise...',
    difficulty: 'intermediate',
    tags: ['machine-learning', 'training', 'validation'],
    expectedTop: ['ml-engineer', 'data-engineer']
  },
  {
    id: 'test-5',
    channel: 'system-design',
    subChannel: 'scalability',
    question: 'Design a distributed cache system for a high-traffic application',
    answer: 'A distributed cache system requires consistent hashing, replication, and cache invalidation strategies...',
    difficulty: 'advanced',
    tags: ['system-design', 'caching', 'distributed-systems'],
    expectedTop: ['backend-engineer', 'sre', 'cloud-architect']
  }
];

console.log('🧪 Testing Job Title Relevance Calculation\n');
console.log('='.repeat(80));

let passedTests = 0;
let failedTests = 0;

for (const testQ of testQuestions) {
  console.log(`\n📝 Test: ${testQ.id}`);
  console.log(`   Channel: ${testQ.channel} / ${testQ.subChannel}`);
  console.log(`   Difficulty: ${testQ.difficulty}`);
  console.log(`   Question: ${testQ.question.substring(0, 60)}...`);
  
  // Calculate relevance
  const relevance = jobTitleService.calculateJobTitleRelevance(testQ);
  const experienceLevels = jobTitleService.determineExperienceLevels(testQ);
  
  // Get top 3 job titles
  const topJobs = jobTitleService.getRelevantJobTitles(relevance, 0)
    .slice(0, 3)
    .map(j => j.title);
  
  console.log(`\n   📊 Relevance Scores:`);
  Object.entries(relevance)
    .sort((a, b) => b[1] - a[1])
    .forEach(([job, score]) => {
      const bar = '█'.repeat(Math.floor(score / 5));
      const isExpected = testQ.expectedTop.includes(job);
      const marker = isExpected ? '✓' : ' ';
      console.log(`   ${marker} ${job.padEnd(20)} ${score.toString().padStart(3)} ${bar}`);
    });
  
  console.log(`\n   🎯 Experience Levels: ${experienceLevels.join(', ')}`);
  console.log(`   🏆 Top 3: ${topJobs.join(', ')}`);
  console.log(`   ✅ Expected: ${testQ.expectedTop.join(', ')}`);
  
  // Check if at least one expected job title is in top 3
  const hasExpected = topJobs.some(job => testQ.expectedTop.includes(job));
  
  if (hasExpected) {
    console.log(`   ✅ PASS - Expected job title in top 3`);
    passedTests++;
  } else {
    console.log(`   ❌ FAIL - Expected job titles not in top 3`);
    failedTests++;
  }
  
  console.log('   ' + '-'.repeat(76));
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Test Results:`);
console.log(`   ✅ Passed: ${passedTests}/${testQuestions.length}`);
console.log(`   ❌ Failed: ${failedTests}/${testQuestions.length}`);
console.log(`   📈 Success Rate: ${Math.round((passedTests / testQuestions.length) * 100)}%`);

if (failedTests === 0) {
  console.log(`\n🎉 All tests passed! Job title relevance calculation is working correctly.`);
} else {
  console.log(`\n⚠️  Some tests failed. Review the scoring algorithm.`);
  process.exit(1);
}
