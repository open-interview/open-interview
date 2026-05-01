/**
 * Vector Enrichment Agent
 * Enriches blog content with related questions as examples and comparisons
 */

import vectorDB from '../ai/services/vector-db.js';

export async function enrichContent(blogContent, question, channel) {
  try {
    await vectorDB.init();
    
    // Find related questions
    const related = await vectorDB.findSimilar(question, {
      limit: 5,
      threshold: 0.3,
      channel
    });

    if (related.length === 0) {
      return { enriched: false, additions: [] };
    }

    // Generate enrichment suggestions
    const additions = [];

    // Add comparison section if we have similar questions
    if (related.length >= 2) {
      const comparisons = related.slice(0, 2).map(q => ({
        question: q.question,
        channel: q.channel,
        context: q.answer?.substring(0, 200)
      }));
      
      additions.push({
        type: 'comparison',
        title: 'Related Concepts',
        content: comparisons,
        placement: 'after-section-2'
      });
    }

    // Add practical examples from related questions
    const examples = related
      .filter(q => q.explanation && q.explanation.length > 100)
      .slice(0, 2)
      .map(q => ({
        question: q.question,
        snippet: q.explanation.substring(0, 300)
      }));

    if (examples.length > 0) {
      additions.push({
        type: 'examples',
        title: 'Real-World Applications',
        content: examples,
        placement: 'before-conclusion'
      });
    }

    return {
      enriched: true,
      relatedCount: related.length,
      additions
    };
  } catch (error) {
    console.error('Vector enrichment failed:', error.message);
    return { enriched: false, additions: [], error: error.message };
  }
}

export default { enrichContent };
