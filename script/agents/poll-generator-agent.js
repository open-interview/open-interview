/**
 * LinkedIn Poll Generator Agent
 * Specialized agent for generating high-quality, debate-driven polls
 * 
 * This agent handles:
 * 1. Topic/Subtopic/Concept decomposition
 * 2. Real-world use case discovery
 * 3. Opinion-based question generation
 * 4. Multi-template selection
 * 5. Hashtag strategy
 * 6. CTA variation
 * 
 * Returns: Ready-to-post poll with full metadata
 */

import ai from '../ai/index.js';
import { webSearch } from '../ai/utils/web-search.js';

export async function generatePollAgent(input) {
  const {
    topic = 'devops',
    subtopic = 'deployment',
    concept = 'canary deployments',
    channel = 'devops',
    verbose = true
  } = input;

  const log = (msg) => verbose && console.log(msg);

  log(`\n${'═'.repeat(60)}`);
  log('🤖 LINKEDIN POLL GENERATOR AGENT');
  log('═'.repeat(60));
  log(`Topic: ${topic}`);
  log(`Subtopic: ${subtopic}`);
  log(`Concept: ${concept}`);
  log(`Channel: ${channel}`);
  log('─'.repeat(60));

  try {
    // STEP 1: Decompose and validate inputs
    log(`\n📋 [STEP 1] Analyzing topic/subtopic/concept...`);
    const decomposed = await analyzeTopicStructure(topic, subtopic, concept);
    log(`   ✅ Core concept: ${decomposed.coreConcept}`);
    log(`   ✅ Keywords: ${decomposed.keywords.join(', ')}`);

    // STEP 2: Search for real-world use cases
    log(`\n🔍 [STEP 2] Searching for real-world use cases...`);
    const useCase = await findRealWorldUseCase(decomposed, channel);
    if (useCase) {
      log(`   ✅ Found: ${useCase.company}`);
      log(`   📖 Situation: ${useCase.situation.substring(0, 60)}...`);
    } else {
      log(`   ⚠️ No use case found, will generate generic poll`);
    }

    // STEP 3: Generate opinion-based poll question
    log(`\n💡 [STEP 3] Generating opinion-based poll question...`);
    const pollContent = await generatePollContent(
      decomposed,
      useCase,
      channel
    );
    log(`   ✅ Question: ${pollContent.question}`);
    log(`   ✅ Options:`);
    pollContent.options.forEach((opt, i) => {
      log(`      ${i + 1}. ${opt}`);
    });

    // STEP 4: Select post template and hashtags
    log(`\n🎨 [STEP 4] Selecting post template & hashtags...`);
    const template = selectTemplate(topic, pollContent.isDebatable);
    const hashtags = selectHashtags(topic, subtopic);
    log(`   ✅ Template: ${template.name}`);
    log(`   ✅ Hashtags: ${hashtags.join(' ')}`);

    // STEP 5: Compose final post
    log(`\n📝 [STEP 5] Composing final post...`);
    const finalPost = composePost(
      pollContent,
      template,
      hashtags,
      useCase
    );
    log(`   ✅ Post ready`);

    log(`\n${'═'.repeat(60)}`);
    log('✅ POLL GENERATION COMPLETE');
    log('═'.repeat(60) + '\n');

    return {
      success: true,
      poll: {
        text: finalPost.text,
        question: pollContent.question,
        options: pollContent.options,
        correctIndex: pollContent.correctIndex,
        hashtags,
        metadata: {
          topic,
          subtopic,
          concept,
          hasRealWorldCase: !!useCase,
          useCase: useCase ? {
            company: useCase.company,
            situation: useCase.situation
          } : null,
          templateUsed: template.name,
          isDebatable: pollContent.isDebatable,
          estimatedEngagement: pollContent.isDebatable ? '8-15%' : '2-5%'
        }
      }
    };

  } catch (error) {
    log(`\n❌ ERROR: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Analyze topic structure and extract core concepts
 */
async function analyzeTopicStructure(topic, subtopic, concept) {
  const topicMap = {
    sre: { keywords: ['reliability', 'incident', 'monitoring', 'alerting'] },
    devops: { keywords: ['deployment', 'automation', 'infrastructure', 'pipeline'] },
    kubernetes: { keywords: ['orchestration', 'containers', 'scaling', 'networking'] },
    terraform: { keywords: ['infrastructure', 'state', 'modules', 'providers'] },
    observability: { keywords: ['monitoring', 'logging', 'tracing', 'metrics'] },
    'ci-cd': { keywords: ['deployment', 'testing', 'automation', 'pipeline'] }
  };

  const baseKeywords = topicMap[topic]?.keywords || [];
  const allKeywords = [...new Set([
    topic,
    subtopic,
    concept,
    ...baseKeywords
  ])];

  return {
    topic,
    subtopic,
    concept,
    coreConcept: concept,
    keywords: allKeywords.slice(0, 5)
  };
}

/**
 * Find real-world use case via web search
 */
async function findRealWorldUseCase(decomposed, channel) {
  const queries = [
    `${decomposed.concept} production incident case study Netflix Uber`,
    `${decomposed.concept} ${decomposed.subtopic} real world example`,
    `${decomposed.concept} outage story lessons learned`,
    `${decomposed.topic} ${decomposed.subtopic} best practices ${decomposed.concept}`
  ];

  for (const query of queries) {
    try {
      const results = await webSearch(query, { numResults: 3, channel });
      if (results && results.length > 0) {
        const result = results[0];
        return {
          company: extractCompany(result.title) || 'A tech company',
          situation: result.snippet || `Learned from ${decomposed.concept}`,
          sourceUrl: result.url,
          sourceTitle: result.title
        };
      }
    } catch (err) {
      // Continue to next query
    }
  }

  return null;
}

/**
 * Extract company name from title
 */
function extractCompany(title) {
  const companies = [
    'Netflix', 'Uber', 'Airbnb', 'Stripe', 'Amazon', 'Google',
    'Meta', 'Apple', 'Microsoft', 'Spotify', 'Twitter', 'LinkedIn',
    'Slack', 'Discord', 'Cloudflare', 'Datadog', 'PagerDuty'
  ];
  
  for (const company of companies) {
    if (title.toLowerCase().includes(company.toLowerCase())) {
      return company;
    }
  }
  return null;
}

/**
 * Generate poll content using AI
 */
async function generatePollContent(decomposed, useCase, channel) {
  const result = await ai.run('linkedinPollUsecase', {
    topic: decomposed.topic,
    subtopic: decomposed.subtopic,
    concept: decomposed.concept,
    useCase,
    channel
  });

  return {
    question: result.pollQuestion,
    options: result.options,
    correctIndex: result.correctIndex,
    introText: result.introText,
    isDebatable: result.options.length === 4 && 
                 result.options.filter((o, i) => i !== result.correctIndex).length > 1
  };
}

/**
 * Select post template based on topic
 */
function selectTemplate(topic, isDebatable) {
  const templates = [
    { name: 'Story Hook', id: 'story' },
    { name: 'Question First', id: 'question' },
    { name: 'Controversial Take', id: 'controversial' },
    { name: 'Stat Lead', id: 'stat' },
    { name: 'Poll Climax', id: 'climax' }
  ];

  // Rotate through templates based on topic
  const topicIndex = topic.charCodeAt(0) % templates.length;
  return templates[topicIndex];
}

/**
 * Select hashtags based on topic
 */
function selectHashtags(topic, subtopic) {
  const hashtagSets = {
    sre: ['#SRE', '#SiteReliabilityEngineering', '#Observability', '#OnCall'],
    devops: ['#DevOps', '#Infrastructure', '#Automation', '#CI-CD'],
    kubernetes: ['#Kubernetes', '#K8s', '#ContainerOrchestration', '#CloudNative'],
    terraform: ['#Terraform', '#InfrastructureAsCode', '#IaC', '#DevOps'],
    observability: ['#Observability', '#Monitoring', '#Logging', '#Metrics'],
    'ci-cd': ['#CI-CD', '#DevOps', '#Automation', '#Deployment']
  };

  const baseSet = hashtagSets[topic] || ['#DevOps', '#TechCommunity'];
  return baseSet.slice(0, 4);
}

/**
 * Compose final post with high-engagement framing
 * Uses debate hooks, controversy, and strong CTAs to maximise votes + comments
 */
function composePost(pollContent, template, hashtags, useCase) {
  // Attribution-safe hook: only reference company if we have a real source URL
  let contextLine = '';
  if (useCase?.sourceUrl) {
    contextLine = `${useCase.company} documented this in a post-mortem — and the lesson still trips teams up today.\n\n`;
  }

  // Debate-framing openers keyed to template
  const debateOpeners = {
    story:        '⚡ Real scenario. What would you do?\n\n',
    question:     '🤔 Engineers disagree on this. Where do you stand?\n\n',
    controversial:'🔥 Hot take: most teams get this wrong. Prove me wrong.\n\n',
    stat:         '📊 This comes up in every production incident review.\n\n',
    climax:       '🚨 You\'re on-call. 2am. This is the question.\n\n'
  };

  const opener = debateOpeners[template.id] || '💡 Quick knowledge check:\n\n';

  // Strong CTA variants — rotate to avoid repetition
  const ctas = [
    '👇 Vote, then drop your reasoning in the comments — let\'s debate.',
    '👇 Cast your vote. Disagree with the result? Say why below.',
    '👇 Vote below. Bonus points if you\'ve hit this in production.',
    '👇 What\'s your answer? Vote and share your war story.',
    '👇 Vote now — poll closes in 2 weeks. Let\'s see where the community lands.'
  ];
  const cta = ctas[pollContent.question.length % ctas.length];

  const body = pollContent.introText
    ? `${pollContent.introText}\n\n`
    : '';

  const text = `${opener}${contextLine}${body}${cta}\n\n${hashtags.join(' ')}`;

  return { text };
}

export default { generatePollAgent };
