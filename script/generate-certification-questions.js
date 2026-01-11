#!/usr/bin/env node
/**
 * Certification Question Generator
 * 
 * Generates exam-aligned MCQ questions for certification prep channels.
 * Uses the certification-question-graph for quality validation.
 * 
 * PRIORITIZATION:
 * - Certifications with 0 questions are processed first
 * - Certifications with fewer questions get higher priority
 * - Domains within certifications are also prioritized by question count
 */

import { generateCertificationQuestions } from './ai/graphs/certification-question-graph.js';
import { certificationDomains } from './ai/prompts/templates/certification-question.js';
import { dbClient, saveQuestion } from './utils.js';

// Get certification channels from environment or use defaults
const CERT_CHANNELS = process.env.CERT_CHANNELS?.split(',') || Object.keys(certificationDomains);
const QUESTIONS_PER_CERT = parseInt(process.env.QUESTIONS_PER_CERT || '3', 10);
const MAX_CERTS_PER_RUN = parseInt(process.env.MAX_CERTS_PER_RUN || '5', 10);

/**
 * Get certifications with fewest questions for balanced generation
 * Prioritizes certifications with 0 questions first, then by ascending count
 */
async function getCertificationsToGenerate() {
  console.log('\n📊 Analyzing certification question counts...');
  
  const counts = [];
  
  for (const certId of CERT_CHANNELS) {
    // Skip if not in our domains config
    if (!certificationDomains[certId]) {
      continue;
    }
    
    try {
      const result = await dbClient.execute({
        sql: `SELECT COUNT(*) as count FROM questions WHERE channel = ? AND status != 'deleted'`,
        args: [certId]
      });
      
      const count = result.rows[0]?.count || 0;
      counts.push({ certId, count });
    } catch (e) {
      counts.push({ certId, count: 0 });
    }
  }
  
  // Sort by count ascending (prioritize certs with fewer questions)
  // Certifications with 0 questions come first
  counts.sort((a, b) => {
    // Both have 0 - maintain original order
    if (a.count === 0 && b.count === 0) return 0;
    // a has 0, b doesn't - a comes first
    if (a.count === 0) return -1;
    // b has 0, a doesn't - b comes first
    if (b.count === 0) return 1;
    // Neither has 0 - sort by count ascending
    return a.count - b.count;
  });
  
  console.log('\nCertification question counts (prioritized):');
  const zeroCount = counts.filter(c => c.count === 0);
  const lowCount = counts.filter(c => c.count > 0 && c.count < 10);
  
  if (zeroCount.length > 0) {
    console.log(`\n🔴 CRITICAL - No questions (${zeroCount.length} certifications):`);
    zeroCount.slice(0, 5).forEach(({ certId }) => {
      console.log(`  ${certId}: 0 questions`);
    });
    if (zeroCount.length > 5) {
      console.log(`  ... and ${zeroCount.length - 5} more`);
    }
  }
  
  if (lowCount.length > 0) {
    console.log(`\n🟡 LOW - Under 10 questions (${lowCount.length} certifications):`);
    lowCount.slice(0, 5).forEach(({ certId, count }) => {
      console.log(`  ${certId}: ${count} questions`);
    });
  }
  
  // Return top N certifications that need content
  return counts.slice(0, MAX_CERTS_PER_RUN).map(c => c.certId);
}

/**
 * Get domains within a certification that need more questions
 * Prioritizes domains with 0 questions first
 */
async function getPrioritizedDomain(certId) {
  const domains = certificationDomains[certId];
  if (!domains || domains.length === 0) {
    return null;
  }
  
  // Get question counts per domain for this certification
  const result = await dbClient.execute({
    sql: `SELECT sub_channel, COUNT(*) as count 
          FROM questions 
          WHERE channel = ? AND status != 'deleted'
          GROUP BY sub_channel`,
    args: [certId]
  });
  
  const domainCounts = {};
  for (const row of result.rows) {
    domainCounts[row.sub_channel] = row.count;
  }
  
  // Sort domains by count ascending, prioritizing 0-count domains
  const sortedDomains = [...domains].map(d => ({
    ...d,
    count: domainCounts[d.id] || 0
  })).sort((a, b) => {
    if (a.count === 0 && b.count === 0) return b.weight - a.weight; // Higher weight first if both 0
    if (a.count === 0) return -1;
    if (b.count === 0) return 1;
    return a.count - b.count;
  });
  
  // Return the domain with fewest questions (or highest weight if tied at 0)
  const selected = sortedDomains[0];
  console.log(`   📌 Prioritized domain: ${selected.name} (${selected.count} questions, ${selected.weight}% weight)`);
  
  return selected.id;
}

/**
 * Save certification question to database
 */
async function saveCertQuestion(question) {
  const id = question.id || `cert-${question.certificationId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  try {
    // Store MCQ options in the answer field as JSON
    // Store additional metadata in tags field
    const tags = [
      ...(question.tags || []),
      'certification-mcq',
      `domain-weight-${question.domainWeight || 0}`
    ];
    
    await dbClient.execute({
      sql: `INSERT OR REPLACE INTO questions 
            (id, channel, sub_channel, question, answer, explanation, difficulty, tags, status, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      args: [
        id,
        question.certificationId,
        question.domain,
        question.question,
        JSON.stringify(question.options), // Store options as answer
        question.explanation,
        question.difficulty,
        JSON.stringify(tags),
        new Date().toISOString()
      ]
    });
    
    console.log(`   ✅ Saved: ${question.question.substring(0, 50)}...`);
    return true;
  } catch (error) {
    console.log(`   ❌ Save failed: ${error.message}`);
    return false;
  }
}

/**
 * Main generation loop
 */
async function main() {
  console.log('\n' + '═'.repeat(60));
  console.log('🎓 CERTIFICATION QUESTION GENERATOR');
  console.log('═'.repeat(60));
  console.log(`Available certifications: ${Object.keys(certificationDomains).length}`);
  console.log(`Questions per cert: ${QUESTIONS_PER_CERT}`);
  console.log(`Max certs per run: ${MAX_CERTS_PER_RUN}`);
  
  // Get certifications that need content
  const targetCerts = await getCertificationsToGenerate();
  
  if (targetCerts.length === 0) {
    console.log('\n✅ No certifications need content generation');
    return;
  }
  
  console.log(`\n🎯 Generating for: ${targetCerts.join(', ')}`);
  
  let totalGenerated = 0;
  let totalSaved = 0;
  
  for (const certId of targetCerts) {
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📝 Generating questions for: ${certId}`);
    
    const domains = certificationDomains[certId];
    if (!domains || domains.length === 0) {
      console.log(`   ⚠️ No domains configured for ${certId}`);
      continue;
    }
    
    try {
      // Get prioritized domain (one with fewest questions)
      const prioritizedDomain = await getPrioritizedDomain(certId);
      
      // Generate questions (use prioritized domain instead of random selection)
      const result = await generateCertificationQuestions({
        certificationId: certId,
        domain: prioritizedDomain, // Use prioritized domain
        difficulty: 'intermediate',
        count: QUESTIONS_PER_CERT
      });
      
      if (result.success && result.questions?.length > 0) {
        totalGenerated += result.questions.length;
        
        // Save each question
        for (const question of result.questions) {
          const saved = await saveCertQuestion(question);
          if (saved) totalSaved++;
        }
      } else {
        console.log(`   ⚠️ Generation failed: ${result.error || 'No questions returned'}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    // Small delay between certifications
    await new Promise(r => setTimeout(r, 1000));
  }
  
  console.log('\n' + '═'.repeat(60));
  console.log('📊 GENERATION COMPLETE');
  console.log('═'.repeat(60));
  console.log(`Total generated: ${totalGenerated}`);
  console.log(`Total saved: ${totalSaved}`);
  console.log('═'.repeat(60));
}

// Run
main().catch(console.error);
