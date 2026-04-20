/**
 * Job Title Relevance Service
 * Analyzes questions and assigns relevance scores for different job titles
 */

// Job title configurations (matches client-side config)
const JOB_TITLE_CONFIGS = {
  'frontend-engineer': {
    primaryChannels: ['javascript', 'react', 'html-css', 'frontend', 'web-performance', 'typescript'],
    secondaryChannels: ['testing', 'accessibility', 'design-patterns', 'css', 'vue', 'angular'],
    keywords: ['component', 'render', 'dom', 'browser', 'ui', 'ux', 'responsive', 'css', 'html', 'jsx']
  },
  'backend-engineer': {
    primaryChannels: ['nodejs', 'python', 'databases', 'api-design', 'system-design', 'microservices'],
    secondaryChannels: ['caching', 'message-queues', 'security', 'golang', 'java', 'rest', 'graphql'],
    keywords: ['api', 'database', 'server', 'endpoint', 'query', 'transaction', 'backend', 'service']
  },
  'fullstack-engineer': {
    primaryChannels: ['javascript', 'react', 'nodejs', 'databases', 'api-design', 'typescript'],
    secondaryChannels: ['system-design', 'devops', 'testing', 'frontend', 'backend'],
    keywords: ['fullstack', 'end-to-end', 'frontend', 'backend', 'api', 'database', 'ui']
  },
  'devops-engineer': {
    primaryChannels: ['docker', 'kubernetes', 'ci-cd', 'linux', 'networking', 'terraform', 'ansible'],
    secondaryChannels: ['monitoring', 'security', 'aws', 'azure', 'gcp', 'jenkins', 'gitlab'],
    keywords: ['deploy', 'pipeline', 'container', 'orchestration', 'infrastructure', 'automation', 'ci/cd']
  },
  'sre': {
    primaryChannels: ['sre', 'monitoring', 'incident-response', 'system-design', 'linux', 'kubernetes'],
    secondaryChannels: ['databases', 'networking', 'security', 'observability', 'alerting'],
    keywords: ['reliability', 'uptime', 'incident', 'monitoring', 'slo', 'sla', 'observability', 'on-call']
  },
  'data-engineer': {
    primaryChannels: ['sql', 'python', 'data-pipelines', 'etl', 'databases', 'spark', 'kafka'],
    secondaryChannels: ['airflow', 'data-modeling', 'data-warehouse', 'bigquery', 'redshift'],
    keywords: ['data', 'pipeline', 'etl', 'warehouse', 'analytics', 'batch', 'streaming', 'transform']
  },
  'ml-engineer': {
    primaryChannels: ['machine-learning', 'python', 'algorithms', 'data-structures', 'deep-learning'],
    secondaryChannels: ['mlops', 'model-deployment', 'feature-engineering', 'tensorflow', 'pytorch'],
    keywords: ['model', 'training', 'inference', 'ml', 'neural', 'feature', 'prediction', 'dataset']
  },
  'cloud-architect': {
    primaryChannels: ['aws', 'system-design', 'networking', 'security', 'kubernetes', 'terraform'],
    secondaryChannels: ['cost-optimization', 'compliance', 'azure', 'gcp', 'multi-cloud'],
    keywords: ['cloud', 'architecture', 'scalability', 'availability', 'disaster-recovery', 'multi-region']
  }
};

// Experience level mappings
const EXPERIENCE_LEVELS = {
  entry: ['beginner', 'intermediate'],
  mid: ['intermediate', 'advanced'],
  senior: ['advanced'],
  staff: ['advanced'],
  principal: ['advanced']
};

/**
 * Calculate job title relevance for a question
 * Returns a mapping of job titles to relevance scores (0-100)
 */
export function calculateJobTitleRelevance(question) {
  const relevance = {};
  
  const channel = question.channel?.toLowerCase() || '';
  const subChannel = question.subChannel?.toLowerCase() || '';
  const tags = Array.isArray(question.tags) 
    ? question.tags 
    : (typeof question.tags === 'string' ? JSON.parse(question.tags || '[]') : []);
  const questionText = (question.question || '').toLowerCase();
  const answerText = (question.answer || '').toLowerCase();
  const difficulty = question.difficulty?.toLowerCase() || 'intermediate';
  
  for (const [jobTitle, config] of Object.entries(JOB_TITLE_CONFIGS)) {
    let score = 0;
    
    // Primary channel match (40 points)
    if (config.primaryChannels.includes(channel)) {
      score += 40;
    }
    
    // Secondary channel match (20 points)
    if (config.secondaryChannels.includes(channel)) {
      score += 20;
    }
    
    // Sub-channel or tag match (15 points)
    const allTopics = [subChannel, ...tags.map(t => t.toLowerCase())];
    if (allTopics.some(topic => 
      config.primaryChannels.includes(topic) || 
      config.secondaryChannels.includes(topic)
    )) {
      score += 15;
    }
    
    // Keyword match in question/answer (25 points max)
    const combinedText = `${questionText} ${answerText}`;
    const matchedKeywords = config.keywords.filter(kw => 
      combinedText.includes(kw.toLowerCase())
    );
    score += Math.min(25, matchedKeywords.length * 5);
    
    // Normalize to 0-100
    relevance[jobTitle] = Math.min(100, score);
  }
  
  return relevance;
}

/**
 * Determine which experience levels this question is suitable for
 */
export function determineExperienceLevels(question) {
  const difficulty = question.difficulty?.toLowerCase() || 'intermediate';
  const levels = [];
  
  for (const [level, difficulties] of Object.entries(EXPERIENCE_LEVELS)) {
    if (difficulties.includes(difficulty)) {
      levels.push(level);
    }
  }
  
  return levels.length > 0 ? levels : ['mid']; // Default to mid-level
}

/**
 * Get top job titles for a question (relevance > 30)
 */
export function getRelevantJobTitles(jobTitleRelevance, threshold = 30) {
  return Object.entries(jobTitleRelevance)
    .filter(([_, score]) => score >= threshold)
    .sort((a, b) => b[1] - a[1])
    .map(([title, score]) => ({ title, score }));
}

/**
 * Enrich question with job title metadata
 */
export function enrichQuestionWithJobTitleData(question) {
  const jobTitleRelevance = calculateJobTitleRelevance(question);
  const experienceLevelTags = determineExperienceLevels(question);
  
  return {
    ...question,
    jobTitleRelevance: JSON.stringify(jobTitleRelevance),
    experienceLevelTags: JSON.stringify(experienceLevelTags)
  };
}

export default {
  calculateJobTitleRelevance,
  determineExperienceLevels,
  getRelevantJobTitles,
  enrichQuestionWithJobTitleData,
  JOB_TITLE_CONFIGS
};
