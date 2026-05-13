import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import ai from '../index.js';
import { saveQuestion, getChannelQuestionCounts, findQuestionById } from '../../utils.js';
import { certificationDomains } from '../prompts/templates/certification-question.js';

const GITHUB_REPO = process.env.GITHUB_REPO || 'open-interview/open-interview.github.io';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

const PROCESSING_HISTORY_DIR = 'data/feedback-processing-history';

import fs from 'fs';
import path from 'path';

function ensureProcessingDir() {
  if (!fs.existsSync(PROCESSING_HISTORY_DIR)) {
    fs.mkdirSync(PROCESSING_HISTORY_DIR, { recursive: true });
  }
}

function readProcessingHistory() {
  ensureProcessingDir();
  const file = path.join(PROCESSING_HISTORY_DIR, 'history.json');
  if (!fs.existsSync(file)) return [];
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return []; }
}

function writeProcessingHistory(history) {
  ensureProcessingDir();
  fs.writeFileSync(path.join(PROCESSING_HISTORY_DIR, 'history.json'), JSON.stringify(history, null, 2));
}

const FeedbackState = Annotation.Root({
  maxIssues: Annotation({ reducer: (_, b) => b, default: () => 10 }),
  singleIssue: Annotation({ reducer: (_, b) => b, default: () => null }),
  externalIssues: Annotation({ reducer: (_, b) => b, default: () => null }),

  currentIssue: Annotation({ reducer: (_, b) => b, default: () => null }),
  questionId: Annotation({ reducer: (_, b) => b, default: () => null }),
  feedbackType: Annotation({ reducer: (_, b) => b, default: () => null }),
  userComment: Annotation({ reducer: (_, b) => b, default: () => null }),

  question: Annotation({ reducer: (_, b) => b, default: () => null }),
  updatedQuestion: Annotation({ reducer: (_, b) => b, default: () => null }),

  issues: Annotation({ reducer: (_, b) => b, default: () => [] }),
  processedCount: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  alreadyProcessed: Annotation({ reducer: (_, b) => b, default: () => false }),

  results: Annotation({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  error: Annotation({ reducer: (_, b) => b, default: () => null })
});

async function initProcessingHistory() {
  ensureProcessingDir();
}

async function wasRecentlyProcessed(issueNumber) {
  try {
    const history = readProcessingHistory();
    const entry = history.find(h => h.issueNumber === issueNumber && h.status === 'completed');
    if (!entry) return false;
    const completedAt = new Date(entry.completedAt).getTime();
    return (Date.now() - completedAt) < 24 * 60 * 60 * 1000;
  } catch (e) {
    return false;
  }
}

async function recordProcessingStart(issueNumber, questionId, feedbackType) {
  try {
    const history = readProcessingHistory();
    const existing = history.find(h => h.issueNumber === issueNumber);
    if (existing) {
      existing.questionId = questionId;
      existing.feedbackType = feedbackType;
      existing.status = 'processing';
      existing.processedAt = new Date().toISOString();
    } else {
      history.push({
        issueNumber,
        questionId,
        feedbackType,
        status: 'processing',
        processedAt: new Date().toISOString(),
        completedAt: null,
        result: null,
        error: null
      });
    }
    writeProcessingHistory(history);
  } catch (e) {
    console.log(`   Warning: Could not record processing start: ${e.message}`);
  }
}

async function recordProcessingComplete(issueNumber, success, result = null, error = null) {
  try {
    const history = readProcessingHistory();
    const entry = history.find(h => h.issueNumber === issueNumber);
    if (entry) {
      entry.status = success ? 'completed' : 'failed';
      entry.completedAt = new Date().toISOString();
      entry.result = result ? JSON.stringify(result) : null;
      entry.error = error;
    }
    writeProcessingHistory(history);
  } catch (e) {
    console.log(`   Warning: Could not record processing completion: ${e.message}`);
  }
}

async function githubApi(endpoint, options = {}) {
  if (!GITHUB_TOKEN) {
    throw new Error('GITHUB_TOKEN not set');
  }

  const url = endpoint.startsWith('http')
    ? endpoint
    : `https://api.github.com/repos/${GITHUB_REPO}${endpoint}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `token ${GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`);
  }

  return options.method === 'PATCH' || options.method === 'DELETE'
    ? null
    : response.json();
}

async function fetchIssuesNode(state) {
  console.log('\n📥 [FETCH_ISSUES] Getting feedback issues...');

  await initProcessingHistory();

  if (state.externalIssues) {
    console.log(`   Processing ${state.externalIssues.length} external issues`);

    const formattedIssues = state.externalIssues.map(issue => ({
      number: issue.number,
      title: issue.title,
      body: issue.body,
      html_url: issue.url,
      labels: [
        { name: 'bot:processor' },
        ...(issue.title.includes('[IMPROVE]') ? [{ name: 'feedback:improve' }] : []),
        ...(issue.title.includes('[REWRITE]') ? [{ name: 'feedback:rewrite' }] : []),
        ...(issue.title.includes('[DISABLE]') ? [{ name: 'feedback:disable' }] : [])
      ]
    }));

    return { issues: formattedIssues };
  }

  if (!GITHUB_TOKEN) {
    console.log('   ⚠️ GITHUB_TOKEN not set, skipping');
    return { error: 'GITHUB_TOKEN not set' };
  }

  try {
    let issues = [];

    if (state.singleIssue) {
      console.log(`   Fetching single issue #${state.singleIssue}...`);
      const issue = await githubApi(`/issues/${state.singleIssue}`);

      if (issue.labels.some(l => l.name === 'bot:processor')) {
        issues = [issue];
      } else {
        console.log(`   ⚠️ Issue #${state.singleIssue} does not have bot:processor label`);
        return { issues: [], error: null };
      }
    } else {
      issues = await githubApi(
        `/issues?labels=bot:processor&state=open&per_page=${state.maxIssues}`
      );
    }

    let pendingIssues = issues.filter(
      issue => !issue.labels.some(l => l.name === 'bot:in-progress')
    );

    pendingIssues = pendingIssues.filter(
      issue => !issue.labels.some(l => l.name === 'bot:completed')
    );

    const filteredIssues = [];
    for (const issue of pendingIssues) {
      const recentlyProcessed = await wasRecentlyProcessed(issue.number);
      if (recentlyProcessed) {
        console.log(`   ⏭️ Skipping issue #${issue.number} (recently processed)`);
      } else {
        filteredIssues.push(issue);
      }
    }

    console.log(`   Found ${filteredIssues.length} pending feedback issues`);

    if (filteredIssues.length === 0) {
      return { issues: [], error: null };
    }

    const prioritizedIssues = await prioritizeIssues(filteredIssues);

    return { issues: prioritizedIssues };
  } catch (error) {
    console.log(`   ❌ Failed to fetch issues: ${error.message}`);
    return { error: error.message };
  }
}

async function prioritizeIssues(issues) {
  if (issues.length <= 1) return issues;

  console.log('\n📊 [PRIORITIZE] Sorting issues by channel priority...');

  let channelCounts = {};
  try {
    channelCounts = await getChannelQuestionCounts();
  } catch (e) {
    console.log('   ⚠️ Could not get channel counts, using default order');
    return issues;
  }

  const certChannels = new Set(Object.keys(certificationDomains));

  const issuesWithPriority = await Promise.all(issues.map(async (issue) => {
    const questionIdMatch = issue.body?.match(/\*\*Question ID:\*\*\s*`([^`]+)`/);
    if (!questionIdMatch) {
      return { issue, priority: 100, channel: null };
    }

    const questionId = questionIdMatch[1];

    try {
      const question = findQuestionById(questionId);
      if (!question) {
        return { issue, priority: 100, channel: null };
      }

      const channel = question.channel;
      const count = channelCounts[channel] || 0;
      const isCert = certChannels.has(channel);

      let priority = count;
      if (count === 0) {
        priority = 0;
      } else if (isCert) {
        priority = Math.floor(count / 2);
      }

      return { issue, priority, channel };
    } catch (e) {
      return { issue, priority: 100, channel: null };
    }
  }));

  issuesWithPriority.sort((a, b) => a.priority - b.priority);

  console.log('   Issue priority order:');
  issuesWithPriority.slice(0, 5).forEach(({ issue, priority, channel }) => {
    const status = priority === 0 ? '🔴 CRITICAL' : priority < 10 ? '🟡 HIGH' : '🟢';
    console.log(`   #${issue.number}: ${channel || 'unknown'} (priority: ${priority}) ${status}`);
  });

  return issuesWithPriority.map(i => i.issue);
}

async function parseFeedbackNode(state) {
  const issue = state.issues[state.processedCount];

  if (!issue) {
    console.log('\n✅ [PARSE_FEEDBACK] No more issues to process');
    return { currentIssue: null };
  }

  console.log(`\n🔍 [PARSE_FEEDBACK] Processing issue #${issue.number}...`);

  const questionIdMatch = issue.body?.match(/\*\*Question ID:\*\*\s*`([^`]+)`/);
  if (!questionIdMatch) {
    console.log('   ⚠️ Could not parse question ID');
    return {
      currentIssue: issue,
      error: 'Could not parse question ID from issue body'
    };
  }

  const questionId = questionIdMatch[1];

  let feedbackType = 'improve';
  if (issue.labels.some(l => l.name === 'feedback:rewrite')) feedbackType = 'rewrite';
  if (issue.labels.some(l => l.name === 'feedback:disable')) feedbackType = 'disable';

  const detailsMatch = issue.body?.match(/### Details\s*\n([\s\S]*?)(?:\n---|$)/);
  const userComment = detailsMatch?.[1]?.trim() || null;

  console.log(`   Question: ${questionId}`);
  console.log(`   Feedback: ${feedbackType}`);
  if (userComment) console.log(`   Comment: ${userComment.substring(0, 50)}...`);

  await recordProcessingStart(issue.number, questionId, feedbackType);

  return {
    currentIssue: issue,
    questionId,
    feedbackType,
    userComment
  };
}

async function fetchQuestionNode(state) {
  if (!state.questionId) {
    return { question: null };
  }

  console.log(`\n📖 [FETCH_QUESTION] Loading question ${state.questionId}...`);

  try {
    const question = findQuestionById(state.questionId);

    if (!question) {
      console.log('   ⚠️ Question not found');
      return { question: null, error: 'Question not found' };
    }

    console.log(`   ✅ Loaded: ${question.question.substring(0, 50)}...`);
    return { question };
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { error: error.message };
  }
}

async function executeActionNode(state) {
  if (!state.question || !state.feedbackType) {
    return { updatedQuestion: null };
  }

  console.log(`\n⚡ [EXECUTE_ACTION] Running ${state.feedbackType} action...`);

  const isExternalIssue = state.externalIssues !== null;

  try {
    if (state.currentIssue && !isExternalIssue) {
      await githubApi(`/issues/${state.currentIssue.number}/labels`, {
        method: 'POST',
        body: JSON.stringify({ labels: ['bot:in-progress'] })
      });
    } else if (isExternalIssue) {
      console.log('   ⏭️ Skipping in-progress label for external issue');
    }

    let updatedQuestion = null;

    switch (state.feedbackType) {
      case 'improve':
        updatedQuestion = await improveQuestion(state.question, state.userComment);
        break;

      case 'rewrite':
        updatedQuestion = await rewriteQuestion(state.question, state.userComment);
        break;

      case 'disable':
        await disableQuestion(state.questionId);
        console.log('   ✅ Question disabled');
        return { updatedQuestion: { ...state.question, status: 'deleted' } };

      default:
        console.log(`   ⚠️ Unknown feedback type: ${state.feedbackType}`);
        return { error: `Unknown feedback type: ${state.feedbackType}` };
    }

    if (updatedQuestion) {
      console.log('   ✅ Action completed successfully');
      return { updatedQuestion };
    }

    return { error: 'Action produced no result' };
  } catch (error) {
    console.log(`   ❌ Action failed: ${error.message}`);
    return { error: error.message };
  }
}

async function improveQuestion(question, userComment) {
  console.log('   🔧 Improving question with AI...');

  const tags = typeof question.tags === 'string' ? JSON.parse(question.tags || '[]') : (question.tags || []);
  const isCertQuestion = tags.includes('certification-mcq');

  const context = {
    question: question.question,
    answer: question.answer,
    explanation: question.explanation,
    channel: question.channel,
    feedback: userComment || 'User requested improvement - make the explanation clearer and more comprehensive'
  };

  const result = await ai.run('improve', context);

  if (result) {
    const updated = {
      ...question,
      answer: result.answer || question.answer,
      explanation: result.explanation || question.explanation,
      diagram: result.diagram || question.diagram,
      eli5: result.eli5 || question.eli5,
      lastUpdated: new Date().toISOString()
    };

    return updated;
  }

  return null;
}

async function rewriteQuestion(question, userComment) {
  console.log('   ✏️ Rewriting question with AI...');

  const tags = typeof question.tags === 'string' ? JSON.parse(question.tags || '[]') : (question.tags || []);
  const isCertQuestion = tags.includes('certification-mcq');

  const context = {
    question: question.question,
    answer: question.answer,
    explanation: question.explanation,
    channel: question.channel,
    subChannel: question.subChannel,
    difficulty: question.difficulty,
    feedback: userComment || 'User requested complete rewrite - content may be incorrect or outdated'
  };

  if (isCertQuestion) {
    const result = await ai.run('certification-question', {
      certificationId: question.channel,
      domain: question.subChannel,
      difficulty: question.difficulty,
      count: 1
    });

    if (result && Array.isArray(result) && result.length > 0) {
      const newQ = result[0];
      return {
        ...question,
        question: newQ.question || question.question,
        answer: JSON.stringify(newQ.options) || question.answer,
        explanation: newQ.explanation || question.explanation,
        tags: newQ.tags || question.tags,
        metadata: {
          ...question.metadata,
          options: newQ.options
        },
        lastUpdated: new Date().toISOString()
      };
    }
  }

  const result = await ai.run('generate', {
    ...context,
    scenarioHint: `REWRITE this existing question. Original: "${question.question}". User feedback: ${userComment || 'needs rewrite'}`
  });

  if (result) {
    return {
      ...question,
      question: result.question || question.question,
      answer: result.answer || question.answer,
      explanation: result.explanation || question.explanation,
      diagram: result.diagram || question.diagram,
      eli5: result.eli5 || question.eli5,
      tags: result.tags || question.tags,
      lastUpdated: new Date().toISOString()
    };
  }

  return null;
}

async function disableQuestion(questionId) {
  const question = findQuestionById(questionId);
  if (question) {
    question.status = 'deleted';
    question.lastUpdated = new Date().toISOString();
    await saveQuestion(question);
  }
}

async function updateQuestionNode(state) {
  if (!state.updatedQuestion || state.feedbackType === 'disable') {
    return {};
  }

  console.log('\n💾 [UPDATE_QUESTION] Saving changes...');

  try {
    await saveQuestion(state.updatedQuestion);
    console.log('   ✅ Question updated');
    return {};
  } catch (error) {
    console.log(`   ❌ Save failed: ${error.message}`);
    return { error: error.message };
  }
}

async function closeIssueNode(state) {
  if (!state.currentIssue) {
    return { processedCount: state.processedCount + 1 };
  }

  console.log(`\n📝 [CLOSE_ISSUE] Updating issue #${state.currentIssue.number}...`);

  const success = !state.error;
  const isExternalIssue = state.externalIssues !== null;

  try {
    let comment = '';

    if (state.error) {
      comment = `## ❌ Processing Failed\n\n**Error:** ${state.error}\n\nPlease check the question ID and try again, or contact maintainers.`;
    } else if (state.feedbackType === 'disable') {
      comment = `## ✅ Question Disabled\n\n**Question ID:** \`${state.questionId}\`\n\nThe question has been marked as deleted and will no longer appear in the app.\n\n---\n*Processed by processor-bot*`;
    } else {
      const action = state.feedbackType === 'improve' ? 'Improved' : 'Rewritten';
      comment = `## ✅ Question ${action}\n\n**Question ID:** \`${state.questionId}\`\n\n### Changes Made:\n`;

      if (state.updatedQuestion) {
        if (state.feedbackType === 'rewrite') {
          comment += `- Question text updated\n`;
        }
        comment += `- Answer enhanced\n`;
        comment += `- Explanation improved\n`;
        if (state.updatedQuestion.diagram !== state.question?.diagram) {
          comment += `- Diagram updated\n`;
        }
      }

      comment += `\n---\n*Processed by processor-bot using AI*`;
    }

    if (!isExternalIssue) {
      await githubApi(`/issues/${state.currentIssue.number}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: comment })
      });

      await githubApi(`/issues/${state.currentIssue.number}`, {
        method: 'PATCH',
        body: JSON.stringify({
          state: 'closed',
          labels: state.error
            ? ['bot:processor', `feedback:${state.feedbackType}`, 'bot:failed']
            : ['bot:processor', `feedback:${state.feedbackType}`, 'bot:completed']
        })
      });

      console.log('   ✅ Issue closed');
    } else {
      console.log('   ✅ External issue processed (will be closed by cross-repo sync)');
    }

    await recordProcessingComplete(
      state.currentIssue.number,
      success,
      success ? { questionId: state.questionId, feedbackType: state.feedbackType } : null,
      state.error
    );

    const result = {
      issueNumber: state.currentIssue.number,
      questionId: state.questionId,
      feedbackType: state.feedbackType,
      success,
      error: state.error
    };

    return {
      processedCount: state.processedCount + 1,
      results: [result],
      currentIssue: null,
      questionId: null,
      feedbackType: null,
      userComment: null,
      question: null,
      updatedQuestion: null,
      error: null
    };
  } catch (error) {
    console.log(`   ❌ Failed to close issue: ${error.message}`);

    await recordProcessingComplete(state.currentIssue.number, false, null, error.message);

    return {
      processedCount: state.processedCount + 1,
      results: [{
        issueNumber: state.currentIssue.number,
        questionId: state.questionId,
        feedbackType: state.feedbackType,
        success: false,
        error: error.message
      }]
    };
  }
}

function shouldContinue(state) {
  if (state.processedCount < state.issues.length) {
    return 'parse_feedback';
  }
  return END;
}

function hasValidIssue(state) {
  if (state.error || !state.currentIssue) {
    return 'close_issue';
  }
  return 'fetch_question';
}

function hasValidQuestion(state) {
  if (state.error || !state.question) {
    return 'close_issue';
  }
  return 'execute_action';
}

export function buildFeedbackProcessorGraph() {
  const graph = new StateGraph(FeedbackState)
    .addNode('fetch_issues', fetchIssuesNode)
    .addNode('parse_feedback', parseFeedbackNode)
    .addNode('fetch_question', fetchQuestionNode)
    .addNode('execute_action', executeActionNode)
    .addNode('update_question', updateQuestionNode)
    .addNode('close_issue', closeIssueNode)

    .addEdge(START, 'fetch_issues')
    .addConditionalEdges('fetch_issues', (state) => {
      if (state.error || state.issues.length === 0) return END;
      return 'parse_feedback';
    })
    .addConditionalEdges('parse_feedback', hasValidIssue)
    .addConditionalEdges('fetch_question', hasValidQuestion)
    .addEdge('execute_action', 'update_question')
    .addEdge('update_question', 'close_issue')
    .addConditionalEdges('close_issue', shouldContinue);

  return graph.compile();
}

export async function processFeedback(options = {}) {
  console.log('\n' + '═'.repeat(60));
  console.log('🔄 LANGGRAPH FEEDBACK PROCESSOR PIPELINE');
  console.log('═'.repeat(60));

  if (options.externalIssues) {
    console.log(`   Mode: External issues processing (${options.externalIssues.length} issues)`);
  } else if (options.singleIssue) {
    console.log(`   Mode: Single issue #${options.singleIssue}`);
  } else {
    console.log(`   Mode: Batch processing (max ${options.maxIssues || 10} issues)`);
  }

  const graph = buildFeedbackProcessorGraph();

  const initialState = {
    maxIssues: options.maxIssues || 10,
    singleIssue: options.singleIssue || null,
    externalIssues: options.externalIssues || null
  };

  const result = await graph.invoke(initialState);

  console.log('\n' + '═'.repeat(60));
  console.log('📊 PROCESSING COMPLETE');
  console.log('═'.repeat(60));
  console.log(`   Total processed: ${result.processedCount}`);
  console.log(`   Successful: ${result.results.filter(r => r.success).length}`);
  console.log(`   Failed: ${result.results.filter(r => !r.success).length}`);

  return result;
}

export default { buildFeedbackProcessorGraph, processFeedback };
