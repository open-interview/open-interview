#!/usr/bin/env node
/**
 * Check Missing Certification Questions
 * Identifies certifications that have no questions generated
 */

import fs from 'fs';
import path from 'path';

// Read certifications config
const configPath = 'client/src/lib/certifications-config.ts';
const configContent = fs.readFileSync(configPath, 'utf-8');

// Extract certification IDs from config
const certIdMatches = configContent.matchAll(/id:\s*'([^']+)'/g);
const allCertIds = [...certIdMatches].map(m => m[1]);

// Read certification questions
const questionsPath = 'client/src/lib/certification-questions.ts';
const questionsContent = fs.readFileSync(questionsPath, 'utf-8');

// Extract certification IDs that have questions
const questionCertIds = new Set();
const questionMatches = questionsContent.matchAll(/certificationId:\s*'([^']+)'/g);
for (const match of questionMatches) {
  questionCertIds.add(match[1]);
}

console.log('🔍 Checking Certification Questions Coverage\n');
console.log('═'.repeat(70));

console.log(`\n📊 Summary:`);
console.log(`   Total Certifications: ${allCertIds.length}`);
console.log(`   With Questions: ${questionCertIds.size}`);
console.log(`   Missing Questions: ${allCertIds.length - questionCertIds.size}`);

console.log(`\n✅ Certifications WITH Questions:`);
[...questionCertIds].sort().forEach(id => {
  const count = (questionsContent.match(new RegExp(`certificationId:\\s*'${id}'`, 'g')) || []).length;
  console.log(`   - ${id} (${count} questions)`);
});

const missingCerts = allCertIds.filter(id => !questionCertIds.has(id));

if (missingCerts.length > 0) {
  console.log(`\n❌ Certifications MISSING Questions:`);
  missingCerts.sort().forEach(id => {
    // Extract name from config
    const nameMatch = configContent.match(new RegExp(`id:\\s*'${id}'[^}]*name:\\s*'([^']+)'`, 's'));
    const name = nameMatch ? nameMatch[1] : id;
    console.log(`   - ${id} (${name})`);
  });
  
  console.log(`\n💡 To generate questions for missing certifications:`);
  console.log(`   node script/generate-certification-questions.js --cert <cert-id>`);
  console.log(`\n   Or generate for all missing:`);
  console.log(`   node script/generate-all-missing-cert-questions.js`);
} else {
  console.log(`\n✅ All certifications have questions!`);
}

console.log('\n' + '═'.repeat(70));
