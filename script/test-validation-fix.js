#!/usr/bin/env node
/**
 * Test script to validate the placeholder pattern fix
 * Ensures legitimate technical content is not rejected
 */

import { validateQuestion } from './bots/shared/validation.js';

const testCases = [
  {
    name: 'Legitimate placeholder usage in HTML',
    question: 'What is the purpose of the placeholder attribute in HTML forms?',
    answer: 'The placeholder attribute provides a hint to the user about what to enter in an input field. It appears as light gray text inside the field before the user types anything.',
    explanation: 'The placeholder attribute is a standard HTML5 feature that improves user experience by providing contextual hints. It should not be used as a replacement for proper labels, as it disappears when the user starts typing and is not accessible to screen readers in the same way as labels.',
    channel: 'frontend',
    subChannel: 'html',
    difficulty: 'beginner',
    tags: ['html', 'forms', 'accessibility'],
    shouldPass: true
  },
  {
    name: 'Legitimate placeholder usage in design',
    question: 'How do you handle placeholder content in a design system?',
    answer: 'Placeholder content in design systems should follow consistent patterns: use semantic colors (typically muted grays), ensure sufficient contrast for readability, and provide clear visual distinction from actual user input.',
    explanation: 'Design systems need clear guidelines for placeholder text to maintain consistency across applications. This includes typography, color schemes, and behavior patterns that help users understand the purpose of form fields without confusion.',
    channel: 'frontend',
    subChannel: 'design-systems',
    difficulty: 'intermediate',
    tags: ['design-systems', 'ux', 'forms'],
    shouldPass: true
  },
  {
    name: 'Incomplete content with TODO',
    question: 'TODO: Write a question about Kubernetes networking',
    answer: 'TODO: Add answer here',
    explanation: 'TODO: Add explanation',
    channel: 'kubernetes',
    subChannel: 'networking',
    difficulty: 'intermediate',
    tags: ['kubernetes'],
    shouldPass: false
  },
  {
    name: 'Incomplete content with FIXME',
    question: 'What is the difference between StatefulSet and Deployment?',
    answer: 'FIXME: This answer needs to be expanded with more details',
    explanation: 'StatefulSets are used for stateful applications while Deployments are for stateless ones.',
    channel: 'kubernetes',
    subChannel: 'workloads',
    difficulty: 'intermediate',
    tags: ['kubernetes'],
    shouldPass: false
  },
  {
    name: 'Complete technical content',
    question: 'Explain the difference between authentication and authorization in web applications',
    answer: 'Authentication verifies who you are (identity), while authorization determines what you can access (permissions). Authentication typically happens first through credentials like passwords or tokens, then authorization checks if the authenticated user has permission to perform specific actions.',
    explanation: 'These are fundamental security concepts. Authentication answers "Who are you?" using methods like passwords, OAuth, or biometrics. Authorization answers "What can you do?" using role-based access control (RBAC), attribute-based access control (ABAC), or other permission systems. Both are essential for secure applications.',
    channel: 'security',
    subChannel: 'authentication',
    difficulty: 'intermediate',
    tags: ['security', 'authentication', 'authorization'],
    shouldPass: true
  }
];

console.log('🧪 Testing Validation Fix\n');
console.log('=' .repeat(80));

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  const result = validateQuestion(testCase);
  const actualPassed = result.isValid;
  const expectedPassed = testCase.shouldPass;
  const testPassed = actualPassed === expectedPassed;
  
  if (testPassed) {
    passed++;
    console.log(`\n✅ PASS: ${testCase.name}`);
  } else {
    failed++;
    console.log(`\n❌ FAIL: ${testCase.name}`);
    console.log(`   Expected: ${expectedPassed ? 'valid' : 'invalid'}`);
    console.log(`   Got: ${actualPassed ? 'valid' : 'invalid'}`);
    if (result.errors.length > 0) {
      console.log(`   Errors: ${result.errors.join(', ')}`);
    }
  }
}

console.log('\n' + '='.repeat(80));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\n❌ Some tests failed!');
  process.exit(1);
} else {
  console.log('\n✅ All tests passed!');
  process.exit(0);
}
