/**
 * Duplicate Prevention Service
 * 
 * Uses RAG (vector DB) to prevent duplicate content creation across:
 * - Questions
 * - Coding Challenges
 * - Tests/MCQs
 * - Certifications
 * - Voice Sessions
 * 
 * This service MUST be called before any content creation or modification.
 */

import vectorDB from './vector-db.js';
import { getDb } from '../../bots/shared/db.js';

const db = getDb();

// Similarity thresholds for different content types
const THRESHOLDS = {
  question: {
    duplicate: 0.90,      // >90% = definite duplicate
    verySimilar: 0.80,    // 80-90% = very similar, likely duplicate
    similar: 0.70,        // 70-80% = similar, review needed
    related: 0.60         // 60-70% = related content
  },
  challenge: {
    duplicate: 0.85,
    verySimilar: 0.75,
    similar: 0.65,
    related: 0.55
  },
  test: {
    duplicate: 0.88,
    verySimilar: 0.78,
    similar: 0.68,
    related: 0.58
  },
  certification: {
    duplicate: 0.90,
    verySimilar: 0.80,
    similar: 0.70,
    related: 0.60
  }
};

class DuplicatePreventionService {
  /**
   * Check if content is a duplicate before creation
   * Returns: { isDuplicate: boolean, duplicates: [], similar: [], recommendation: string }
   */
  async checkBeforeCreate(content, contentType = 'question') {
    console.log(`\n🔍 [Duplicate Check] Analyzing ${contentType}...`);
    
    const thresholds = THRESHOLDS[contentType] || THRESHOLDS.question;
    
    // Build search text based on content type
    const searchText = this.buildSearchText(content, contentType);
    
    if (!searchText || searchText.length < 20) {
      return {
        isDuplicate: false,
        duplicates: [],
        similar: [],
        recommendation: 'insufficient_content',
        message: 'Content too short to check for duplicates'
      };
    }
    
    // Search vector DB for similar content
    const results = await this.searchSimilarContent(searchText, contentType, content);
    
    // Categorize results by similarity
    const duplicates = results.filter(r => r.similarity >= thresholds.duplicate);
    const verySimilar = results.filter(r => r.similarity >= thresholds.verySimilar && r.similarity < thresholds.duplicate);
    const similar = results.filter(r => r.similarity >= thresholds.similar && r.similarity < thresholds.verySimilar);
    const related = results.filter(r => r.similarity >= thresholds.related && r.similarity < thresholds.similar);
    
    // Determine recommendation
    let recommendation = 'create';
    let message = 'No duplicates found, safe to create';
    let isDuplicate = false;
    
    if (duplicates.length > 0) {
      recommendation = 'reject';
      message = `Found ${duplicates.length} duplicate(s) with >${thresholds.duplicate * 100}% similarity`;
      isDuplicate = true;
    } else if (verySimilar.length > 0) {
      recommendation = 'review';
      message = `Found ${verySimilar.length} very similar item(s), manual review recommended`;
      isDuplicate = true; // Treat as duplicate to be safe
    } else if (similar.length > 0) {
      recommendation = 'review';
      message = `Found ${similar.length} similar item(s), consider reviewing`;
    } else if (related.length > 0) {
      recommendation = 'create_with_caution';
      message = `Found ${related.length} related item(s), ensure differentiation`;
    }
    
    // Log the check
    console.log(`   Result: ${recommendation}`);
    console.log(`   Duplicates: ${duplicates.length}, Very Similar: ${verySimilar.length}, Similar: ${similar.length}`);
    
    if (duplicates.length > 0) {
      console.log(`   🚫 DUPLICATE DETECTED:`);
      duplicates.forEach(d => {
        console.log(`      - ${d.id}: ${Math.round(d.similarity * 100)}% similar`);
        console.log(`        "${d.content?.substring(0, 80)}..."`);
      });
    }
    
    return {
      isDuplicate,
      duplicates,
      verySimilar,
      similar,
      related,
      recommendation,
      message,
      totalFound: results.length,
      thresholds
    };
  }
  
  /**
   * Check if modification would create a duplicate
   */
  async checkBeforeModify(originalId, modifiedContent, contentType = 'question') {
    console.log(`\n🔍 [Duplicate Check] Checking modification of ${originalId}...`);
    
    const result = await this.checkBeforeCreate(modifiedContent, contentType);
    
    // Filter out the original item from results
    result.duplicates = result.duplicates.filter(d => d.id !== originalId);
    result.verySimilar = result.verySimilar.filter(d => d.id !== originalId);
    result.similar = result.similar.filter(d => d.id !== originalId);
    result.related = result.related.filter(d => d.id !== originalId);
    
    // Re-evaluate recommendation after filtering
    if (result.duplicates.length === 0 && result.verySimilar.length === 0) {
      result.isDuplicate = false;
      result.recommendation = result.similar.length > 0 ? 'modify_with_caution' : 'modify';
      result.message = 'Modification is safe';
    }
    
    return result;
  }
  
  /**
   * Search for similar content in vector DB
   */
  async searchSimilarContent(searchText, contentType, content) {
    try {
      await vectorDB.init();
      
      // Determine which collection to search based on content type
      const options = {
        limit: 20,
        threshold: 0.5, // Lower threshold to catch more potential duplicates
      };
      
      // Add channel filter if available
      if (content.channel) {
        options.channel = content.channel;
      }
      
      // Search vector DB
      const vectorResults = await vectorDB.semanticSearch(searchText, options);
      
      // Convert to standard format
      return vectorResults.map(r => ({
        id: r.id,
        similarity: r.relevance / 100, // Convert back to 0-1 scale
        content: r.question || r.title || r.description,
        channel: r.channel,
        difficulty: r.difficulty,
        type: contentType
      }));
      
    } catch (error) {
      console.warn(`   Vector DB search failed: ${error.message}`);
      
      // Fallback to database text search
      return await this.fallbackTextSearch(searchText, contentType, content);
    }
  }
  
  /**
   * Fallback text-based search when vector DB is unavailable
   */
  async fallbackTextSearch(searchText, contentType, content) {
    console.log('   Using fallback text search...');
    
    const results = [];
    
    try {
      // Search questions table
      if (contentType === 'question') {
        const dbResults = await db.execute({
          sql: `SELECT id, question, channel, difficulty 
                FROM questions 
                WHERE channel = ? AND status = 'active' 
                LIMIT 50`,
          args: [content.channel || 'system-design']
        });
        
        // Calculate text similarity for each result
        for (const row of dbResults.rows) {
          const similarity = this.calculateTextSimilarity(searchText, row.question);
          if (similarity >= 0.5) {
            results.push({
              id: row.id,
              similarity,
              content: row.question,
              channel: row.channel,
              difficulty: row.difficulty,
              type: 'question'
            });
          }
        }
      }
      
      // TODO: Add fallback for other content types (challenges, tests, etc.)
      
    } catch (error) {
      console.error(`   Fallback search failed: ${error.message}`);
    }
    
    return results.sort((a, b) => b.similarity - a.similarity);
  }
  
  /**
   * Build search text from content based on type
   */
  buildSearchText(content, contentType) {
    switch (contentType) {
      case 'question':
        return [
          content.question,
          content.answer?.substring(0, 300),
          content.explanation?.substring(0, 300)
        ].filter(Boolean).join(' ');
        
      case 'challenge':
        return [
          content.title,
          content.description?.substring(0, 500)
        ].filter(Boolean).join(' ');
        
      case 'test':
        return [
          content.question,
          content.options?.map(o => o.text).join(' ')
        ].filter(Boolean).join(' ');
        
      case 'certification':
        return [
          content.question,
          content.explanation?.substring(0, 300)
        ].filter(Boolean).join(' ');
        
      default:
        return content.question || content.title || content.description || '';
    }
  }
  
  /**
   * Simple text similarity calculation (Jaccard similarity)
   */
  calculateTextSimilarity(text1, text2) {
    const words1 = new Set(text1.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    const words2 = new Set(text2.toLowerCase().split(/\W+/).filter(w => w.length > 3));
    
    const intersection = new Set([...words1].filter(w => words2.has(w)));
    const union = new Set([...words1, ...words2]);
    
    return union.size > 0 ? intersection.size / union.size : 0;
  }
  
  /**
   * Batch check multiple items for duplicates
   */
  async batchCheck(items, contentType = 'question') {
    console.log(`\n🔍 [Batch Duplicate Check] Checking ${items.length} items...`);
    
    const results = [];
    let duplicateCount = 0;
    let similarCount = 0;
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const result = await this.checkBeforeCreate(item, contentType);
      
      results.push({
        item,
        ...result
      });
      
      if (result.isDuplicate) duplicateCount++;
      if (result.similar.length > 0) similarCount++;
      
      // Rate limiting
      if (i < items.length - 1) {
        await new Promise(r => setTimeout(r, 200));
      }
    }
    
    console.log(`   Summary: ${duplicateCount} duplicates, ${similarCount} similar items found`);
    
    return {
      results,
      summary: {
        total: items.length,
        duplicates: duplicateCount,
        similar: similarCount,
        clean: items.length - duplicateCount - similarCount
      }
    };
  }
  
  /**
   * Find existing duplicates in the database
   */
  async findExistingDuplicates(contentType = 'question', options = {}) {
    const { channel = null, limit = 100 } = options;
    
    console.log(`\n🔍 [Find Duplicates] Scanning existing ${contentType}s...`);
    
    // Get all items of this type
    let items = [];
    
    if (contentType === 'question') {
      let sql = 'SELECT id, question, answer, explanation, channel, difficulty FROM questions WHERE status = ?';
      const args = ['active'];
      
      if (channel) {
        sql += ' AND channel = ?';
        args.push(channel);
      }
      
      sql += ' LIMIT ?';
      args.push(limit);
      
      const result = await db.execute({ sql, args });
      items = result.rows.map(row => ({
        id: row.id,
        question: row.question,
        answer: row.answer,
        explanation: row.explanation,
        channel: row.channel,
        difficulty: row.difficulty
      }));
    }
    
    // Check each item against others
    const duplicatePairs = [];
    
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const searchText = this.buildSearchText(item, contentType);
      
      const similar = await this.searchSimilarContent(searchText, contentType, item);
      const duplicates = similar.filter(s => 
        s.id !== item.id && 
        s.similarity >= THRESHOLDS[contentType].duplicate
      );
      
      if (duplicates.length > 0) {
        duplicatePairs.push({
          original: item.id,
          duplicates: duplicates.map(d => ({
            id: d.id,
            similarity: Math.round(d.similarity * 100)
          }))
        });
        
        console.log(`   Found duplicate: ${item.id} has ${duplicates.length} duplicate(s)`);
      }
      
      // Rate limiting
      if (i < items.length - 1 && i % 10 === 0) {
        await new Promise(r => setTimeout(r, 500));
      }
    }
    
    console.log(`   Total duplicate pairs found: ${duplicatePairs.length}`);
    
    return {
      duplicatePairs,
      totalScanned: items.length,
      duplicateCount: duplicatePairs.length
    };
  }
  
  /**
   * Log duplicate check to database for monitoring
   */
  async logDuplicateCheck(checkResult, contentType, action = 'create') {
    try {
      await db.execute({
        sql: `INSERT INTO duplicate_checks (content_type, action, is_duplicate, duplicate_count, similar_count, recommendation, timestamp)
              VALUES (?, ?, ?, ?, ?, ?, ?)`,
        args: [
          contentType,
          action,
          checkResult.isDuplicate ? 1 : 0,
          checkResult.duplicates?.length || 0,
          checkResult.similar?.length || 0,
          checkResult.recommendation,
          new Date().toISOString()
        ]
      });
    } catch (error) {
      // Table might not exist, create it
      try {
        await db.execute(`
          CREATE TABLE IF NOT EXISTS duplicate_checks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content_type TEXT NOT NULL,
            action TEXT NOT NULL,
            is_duplicate INTEGER NOT NULL,
            duplicate_count INTEGER NOT NULL,
            similar_count INTEGER NOT NULL,
            recommendation TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        
        // Retry insert
        await db.execute({
          sql: `INSERT INTO duplicate_checks (content_type, action, is_duplicate, duplicate_count, similar_count, recommendation, timestamp)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
          args: [
            contentType,
            action,
            checkResult.isDuplicate ? 1 : 0,
            checkResult.duplicates?.length || 0,
            checkResult.similar?.length || 0,
            checkResult.recommendation,
            new Date().toISOString()
          ]
        });
      } catch (e) {
        console.warn(`Failed to log duplicate check: ${e.message}`);
      }
    }
  }
}

// Singleton instance
const duplicatePreventionService = new DuplicatePreventionService();

export default duplicatePreventionService;

// Export helper functions for easy integration
export async function checkDuplicateBeforeCreate(content, contentType = 'question') {
  const result = await duplicatePreventionService.checkBeforeCreate(content, contentType);
  await duplicatePreventionService.logDuplicateCheck(result, contentType, 'create');
  return result;
}

export async function checkDuplicateBeforeModify(originalId, modifiedContent, contentType = 'question') {
  const result = await duplicatePreventionService.checkBeforeModify(originalId, modifiedContent, contentType);
  await duplicatePreventionService.logDuplicateCheck(result, contentType, 'modify');
  return result;
}

export async function batchCheckDuplicates(items, contentType = 'question') {
  return await duplicatePreventionService.batchCheck(items, contentType);
}

export async function findExistingDuplicates(contentType = 'question', options = {}) {
  return await duplicatePreventionService.findExistingDuplicates(contentType, options);
}
