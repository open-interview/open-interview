/**
 * Enhanced Question Generator with Certification Awareness
 * 
 * Dynamically loads certification mappings from certifications-config.ts at runtime
 * Automatically updates when certification config changes
 */

import { generateQuestion as originalGenerateQuestion } from './question-graph.js';
import { generateCertificationQuestions } from './certification-question-graph.js';
import { certificationDomains } from '../prompts/templates/certification-question.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cache for channel-to-cert mappings with TTL
let cachedMappings = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60 * 1000; // 1 minute cache

/**
 * Dynamically load channel-to-certification mappings from config file
 * Parses the TypeScript config and builds the mapping at runtime
 */
function loadChannelToCertMappings() {
  const now = Date.now();
  
  // Return cached mappings if still valid
  if (cachedMappings && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedMappings;
  }
  
  try {
    // Read the certifications config file
    const configPath = join(__dirname, '../../../client/src/lib/certifications-config.ts');
    const configContent = readFileSync(configPath, 'utf-8');
    
    // Extract the certificationsConfig array using regex
    const configMatch = configContent.match(/export const certificationsConfig[^=]*=\s*\[([\s\S]*?)\];/);
    if (!configMatch) {
      console.warn('⚠️  Could not parse certificationsConfig from config file');
      return {};
    }
    
    // Parse certification objects to extract id and channelMappings
    const certObjects = configMatch[1];
    const channelToCerts = {};
    
    // Match each certification object
    const certRegex = /\{\s*id:\s*['"]([^'"]+)['"],[^}]*channelMappings:\s*\[([\s\S]*?)\]/g;
    let match;
    
    while ((match = certRegex.exec(certObjects)) !== null) {
      const certId = match[1];
      const mappingsStr = match[2];
      
      // Extract channel IDs from channelMappings
      const channelRegex = /channelId:\s*['"]([^'"]+)['"]/g;
      let channelMatch;
      
      while ((channelMatch = channelRegex.exec(mappingsStr)) !== null) {
        const channelId = channelMatch[1];
        
        if (!channelToCerts[channelId]) {
          channelToCerts[channelId] = [];
        }
        
        if (!channelToCerts[channelId].includes(certId)) {
          channelToCerts[channelId].push(certId);
        }
      }
    }
    
    // Update cache
    cachedMappings = channelToCerts;
    cacheTimestamp = now;
    
    console.log(`✅ Loaded ${Object.keys(channelToCerts).length} channel-to-cert mappings from config`);
    
    return channelToCerts;
  } catch (error) {
    console.warn(`⚠️  Failed to load certification mappings: ${error.message}`);
    console.warn('   Falling back to empty mappings');
    return {};
  }
}

/**
 * Force reload of certification mappings (clears cache)
 */
export function reloadCertificationMappings() {
  cachedMappings = null;
  cacheTimestamp = 0;
  console.log('🔄 Certification mappings cache cleared');
  return loadChannelToCertMappings();
}

/**
 * Get current cached mappings (for debugging/inspection)
 */
export function getCurrentMappings() {
  return loadChannelToCertMappings();
}

/**
 * Enhanced question generator that considers certifications
 * 
 * When generating questions for a channel, it will:
 * 1. Generate regular interview questions (existing logic)
 * 2. Check if channel maps to any certifications
 * 3. Optionally generate certification MCQ questions
 * 
 * @param {Object} options - Generation options
 * @param {string} options.channel - Channel ID
 * @param {string} options.subChannel - Sub-channel ID
 * @param {string} options.difficulty - Question difficulty
 * @param {boolean} options.includeCertifications - Whether to generate cert questions (default: true)
 * @param {number} options.certQuestionsPerCert - Number of cert questions per certification (default: 1)
 * @returns {Object} Generation result with both regular and cert questions
 */
export async function generateQuestionWithCertifications(options) {
  const {
    channel,
    subChannel,
    difficulty = 'intermediate',
    includeCertifications = true,
    certQuestionsPerCert = 1,
    ...otherOptions
  } = options;
  
  console.log(`\n🎯 Enhanced Question Generation for: ${channel}`);
  
  // Step 1: Generate regular interview question
  console.log(`   📝 Generating regular interview question...`);
  const regularResult = await originalGenerateQuestion({
    channel,
    subChannel,
    difficulty,
    ...otherOptions
  });
  
  const results = {
    regular: regularResult,
    certifications: []
  };
  
  // Step 2: Check for certification mappings (dynamically loaded)
  if (!includeCertifications) {
    console.log(`   ⏭️  Skipping certification questions (includeCertifications=false)`);
    return results;
  }
  
  const channelToCerts = loadChannelToCertMappings();
  const relatedCerts = channelToCerts[channel] || [];
  
  if (relatedCerts.length === 0) {
    console.log(`   ℹ️  No certifications mapped to channel: ${channel}`);
    return results;
  }
  
  console.log(`   🎓 Found ${relatedCerts.length} related certifications: ${relatedCerts.join(', ')}`);
  
  // Step 3: Generate certification questions for each related cert
  for (const certId of relatedCerts) {
    // Check if this cert has domains configured
    if (!certificationDomains[certId]) {
      console.log(`   ⚠️  No domains configured for ${certId}, skipping`);
      continue;
    }
    
    try {
      console.log(`   📋 Generating ${certQuestionsPerCert} MCQ for ${certId}...`);
      
      const certResult = await generateCertificationQuestions({
        certificationId: certId,
        difficulty,
        count: certQuestionsPerCert
      });
      
      if (certResult.success) {
        results.certifications.push({
          certId,
          result: certResult
        });
        console.log(`   ✅ Generated ${certResult.questions?.length || 0} cert questions for ${certId}`);
      } else {
        console.log(`   ⚠️  Failed to generate cert questions for ${certId}: ${certResult.error}`);
      }
    } catch (error) {
      console.log(`   ❌ Error generating cert questions for ${certId}: ${error.message}`);
    }
  }
  
  return results;
}

/**
 * Get certifications related to a channel (dynamically loaded)
 */
export function getCertificationsForChannel(channel) {
  const mappings = loadChannelToCertMappings();
  return mappings[channel] || [];
}

/**
 * Get all channels that have certification mappings (dynamically loaded)
 */
export function getChannelsWithCertifications() {
  const mappings = loadChannelToCertMappings();
  return Object.keys(mappings);
}

/**
 * Check if a channel has related certifications (dynamically loaded)
 */
export function hasRelatedCertifications(channel) {
  const mappings = loadChannelToCertMappings();
  return (mappings[channel] || []).length > 0;
}

export default {
  generateQuestionWithCertifications,
  getCertificationsForChannel,
  getChannelsWithCertifications,
  hasRelatedCertifications,
  reloadCertificationMappings,
  getCurrentMappings
};
