/**
 * Example: Using Enhanced Question Generator
 */

import { generateQuestionWithCertifications } from './ai/graphs/enhanced-question-generator.js';

// Example 1: Generate question for AWS channel (will include AWS cert questions)
const result1 = await generateQuestionWithCertifications({
  channel: 'aws',
  subChannel: 'ec2',
  difficulty: 'intermediate',
  includeCertifications: true,  // default
  certQuestionsPerCert: 2       // generate 2 MCQs per related cert
});

console.log('Regular question:', result1.regular);
console.log('Certification questions:', result1.certifications);

// Example 2: Generate only regular question (skip certs)
const result2 = await generateQuestionWithCertifications({
  channel: 'aws',
  difficulty: 'advanced',
  includeCertifications: false  // skip cert questions
});

// Example 3: Generate for Kubernetes (will include CKA, CKAD, CKS)
const result3 = await generateQuestionWithCertifications({
  channel: 'kubernetes',
  difficulty: 'intermediate'
});
