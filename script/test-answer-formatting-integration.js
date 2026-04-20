#!/usr/bin/env node
/**
 * Test Answer Formatting Standards Integration
 * 
 * Tests the integration of Answer Formatting Standards with the bot pipeline
 */

import 'dotenv/config';

// Test the Answer Formatting Standards integration
async function testAnswerFormattingIntegration() {
  console.log('=== Testing Answer Formatting Standards Integration ===\n');
  
  try {
    // Import the integration function
    const { applyAnswerFormattingStandards } = await import('./bots/creator-bot.js');
    
    // Test content with different patterns
    const testCases = [
      {
        name: 'Comparison Question',
        content: {
          id: 'test-1',
          question: 'What are the differences between REST and GraphQL APIs?',
          explanation: 'REST uses multiple endpoints while GraphQL uses a single endpoint. REST fetches fixed data structures while GraphQL allows flexible queries. REST has better caching while GraphQL has better performance for complex queries.'
        }
      },
      {
        name: 'Process Question',
        content: {
          id: 'test-2',
          question: 'How do you implement a CI/CD pipeline?',
          explanation: 'Set up version control. Configure build automation. Add testing stages. Deploy to staging environment. Run integration tests. Deploy to production.'
        }
      },
      {
        name: 'Definition Question',
        content: {
          id: 'test-3',
          question: 'What is microservices architecture?',
          explanation: 'Microservices architecture is a design approach where applications are built as a collection of small, independent services. Each service is responsible for a specific business function. Services communicate through APIs. They can be developed and deployed independently.'
        }
      }
    ];
    
    for (const testCase of testCases) {
      console.log(`\n--- Testing: ${testCase.name} ---`);
      console.log(`Question: ${testCase.content.question}`);
      console.log(`Original Answer Length: ${testCase.content.explanation.length} chars`);
      
      try {
        const result = await applyAnswerFormattingStandards(testCase.content);
        
        console.log(`✅ Pattern Detected: ${result.detectedPattern || 'none'}`);
        console.log(`✅ Validation Score: ${result.score}/100`);
        console.log(`✅ Violations: ${result.violations.length}`);
        console.log(`✅ Auto-formatted: ${result.formatted ? 'Yes' : 'No'}`);
        
        if (result.formatted) {
          console.log(`✅ Formatted Answer Length: ${result.formattedAnswer.length} chars`);
          console.log(`✅ Applied Pattern: ${result.appliedPattern}`);
        }
        
        if (result.violations.length > 0) {
          console.log('   Violations:');
          result.violations.forEach((v, i) => {
            console.log(`   ${i + 1}. [${v.severity}] ${v.message}`);
          });
        }
        
      } catch (error) {
        console.error(`❌ Test failed: ${error.message}`);
        console.error(error.stack);
      }
    }
    
    console.log('\n=== Integration Test Complete ===');
    
  } catch (error) {
    console.error('Failed to import integration function:', error.message);
    console.error(error.stack);
  }
}

// Run the test
testAnswerFormattingIntegration().catch(console.error);