/**
 * LangGraph-based Feedback Processor Pipeline
 * 
 * Processes user feedback from GitHub Issues:
 * - Fetches open issues with bot:processor label
 * - Parses question ID and feedback type
 * - Executes appropriate action (improve/rewrite/delete)
 * - Comments on issue with results
 * - Closes issue when complete
 * 
 * Flow:
 *   fetch_issues → parse_feedback → fetch_question → execute_action → update_question → close_issue → end
 */

import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import ai from '../index.js';
import { dbClient, saveQuestion } from '../../utils.js';

// GitHub configuration
const GITHUB_REPO = process.env.GITHUB_REPO || 'open-interview/open-interview.github.io';
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;

// Define the state schema
const FeedbackState = Annotation.Root({
  // Input
  maxIssues: Annotation({ reducer: (_, b) => b, default: () => 10 }),
  
  // Current issue being processed
  currentIssue: Annotation({ reducer: (_, b) => b, default: () => null }),
  questionId: Annotation({ reducer: (_, b) => b, default: () => null }),
  feedbackType: Annotation({ reducer: (_, b) => b, default: () => null }),
  userComment: Annotation({ reducer: (_, b) => b, default: () => null }),
  
  // Question data
  question: Annotation({ reducer: (_, b) => b, default: () => null }),
  updatedQuestion: Annotation({ reducer: (_, b) => b, default: () => null }),
  
  // Processing state
  issues: Annotation({ reducer: (_, b) => b, default: () => [] }),
  processedCount: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  
  // Results
  results: Annotation({ reducer: (a, b) => [...a, ...b], default: () => [] }),
  error: Annotation({ reducer: (_, b) => b, default: () => null })
});

/**
 * GitHub API helper
 */
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

/**
 * Node: Fetch open issues with bot:processor label
 */
async function fetchIssuesNode(state) {
  console.log('\n📥 [FETCH_ISSUES] Getting feedback issues from GitHub...');
  
  if (!GITHUB_TOKEN) {
    console.log('   ⚠️ GITHUB_TOKEN not set, skipping');
    return { error: 'GITHUB_TOKEN not set' };
  }
  
  try {
    const issues = await githubApi(
      `/issues?labels=bot:processor&state=open&per_page=${state.maxIssues}`
    );
    
    // Filter out issues already being processed
    const pendingIssues = issues.filter(
      issue => !issue.labels.some(l => l.name === 'bot:in-progress')
    );
    
    console.log(`   Found ${pendingIssues.length} pending feedback issues`);
    
    if (pendingIssues.length === 0) {
      return { issues: [], error: null };
    }
    
    return { issues: pendingIssues };
  } catch (error) {
    console.log(`   ❌ Failed to fetch issues: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * Node: Parse feedback from current issue
 */
function parseFeedbackNode(state) {
  const issue = state.issues[state.processedCount];
  
  if (!issue) {
    console.log('\n✅ [PARSE_FEEDBACK] No more issues to process');
    return { currentIssue: null };
  }
  
  console.log(`\n🔍 [PARSE_FEEDBACK] Processing issue #${issue.number}...`);
  
  // Parse question ID from issue body
  const questionIdMatch = issue.body?.match(/\*\*Question ID:\*\*\s*`([^`]+)`/);
  if (!questionIdMatch) {
    console.log('   ⚠️ Could not parse question ID');
    return { 
      currentIssue: issue,
      error: 'Could not parse question ID from issue body'
    };
  }
  
  const questionId = questionIdMatch[1];
  
  // Determine feedback type from labels
  let feedbackType = 'improve';
  if (issue.labels.some(l => l.name === 'feedback:rewrite')) feedbackType = 'rewrite';
  if (issue.labels.some(l => l.name === 'feedback:disable')) feedbackType = 'disable';
  
  // Extract user comment (everything after "### Details")
  const detailsMatch = issue.body?.match(/### Details\s*\n([\s\S]*?)(?:\n---|$)/);
  const userComment = detailsMatch?.[1]?.trim() || null;
  
  console.log(`   Question: ${questionId}`);
  console.log(`   Feedback: ${feedbackType}`);
  if (userComment) console.log(`   Comment: ${userComment.substring(0, 50)}...`);
  
  return {
    currentIssue: issue,
    questionId,
    feedbackType,
    userComment
  };
}

/**
 * Node: Fetch question from database
 */
async function fetchQuestionNode(state) {
  if (!state.questionId) {
    return { question: null };
  }
  
  console.log(`\n📖 [FETCH_QUESTION] Loading question ${state.questionId}...`);
  
  try {
    const result = await dbClient.execute({
      sql: 'SELECT * FROM questions WHERE id = ?',
      args: [state.questionId]
    });
    
    if (result.rows.length === 0) {
      console.log('   ⚠️ Question not found');
      return { question: null, error: 'Question not found in database' };
    }
    
    const row = result.rows[0];
    const question = {
      id: row.id,
      question: row.question,
      answer: row.answer,
      explanation: row.explanation,
      diagram: row.diagram,
      difficulty: row.difficulty,
      tags: row.tags ? JSON.parse(row.tags) : [],
      channel: row.channel,
      subChannel: row.sub_channel,
      videos: row.videos ? JSON.parse(row.videos) : null,
      companies: row.companies ? JSON.parse(row.companies) : null,
      eli5: row.eli5
    };
    
    console.log(`   ✅ Loaded: ${question.question.substring(0, 50)}...`);
    return { question };
  } catch (error) {
    console.log(`   ❌ Database error: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * Node: Execute the appropriate action based on feedback type
 */
async function executeActionNode(state) {
  if (!state.question || !state.feedbackType) {
    return { updatedQuestion: null };
  }
  
  console.log(`\n⚡ [EXECUTE_ACTION] Running ${state.feedbackType} action...`);
  
  try {
    // Add in-progress label to issue
    if (state.currentIssue) {
      await githubApi(`/issues/${state.currentIssue.number}/labels`, {
        method: 'POST',
        body: JSON.stringify({ labels: ['bot:in-progress'] })
      });
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

/**
 * Improve question using AI
 */
async function improveQuestion(question, userComment) {
  console.log('   🔧 Improving question with AI...');
  
  const context = {
    question: question.question,
    answer: question.answer,
    explanation: question.explanation,
    channel: question.channel,
    feedback: userComment || 'User requested improvement - make the explanation clearer and more comprehensive'
  };
  
  const result = await ai.run('improve', context);
  
  if (result) {
    return {
      ...question,
      answer: result.answer || question.answer,
      explanation: result.explanation || question.explanation,
      diagram: result.diagram || question.diagram,
      eli5: result.eli5 || question.eli5,
      lastUpdated: new Date().toISOString()
    };
  }
  
  return null;
}

/**
 * Rewrite question using AI
 */
async function rewriteQuestion(question, userComment) {
  console.log('   ✏️ Rewriting question with AI...');
  
  const context = {
    question: question.question,
    answer: question.answer,
    explanation: question.explanation,
    channel: question.channel,
    subChannel: question.subChannel,
    difficulty: question.difficulty,
    feedback: userComment || 'User requested complete rewrite - content may be incorrect or outdated'
  };
  
  // Use generate template with rewrite hint
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

/**
 * Disable/delete question
 */
async function disableQuestion(questionId) {
  await dbClient.execute({
    sql: `UPDATE questions SET status = 'deleted', last_updated = ? WHERE id = ?`,
    args: [new Date().toISOString(), questionId]
  });
}

/**
 * Node: Update question in database
 */
async function updateQuestionNode(state) {
  if (!state.updatedQuestion || state.feedbackType === 'disable') {
    return {};
  }
  
  console.log('\n💾 [UPDATE_QUESTION] Saving changes to database...');
  
  try {
    await saveQuestion(state.updatedQuestion);
    console.log('   ✅ Question updated');
    return {};
  } catch (error) {
    console.log(`   ❌ Save failed: ${error.message}`);
    return { error: error.message };
  }
}

/**
 * Node: Close GitHub issue with results
 */
async function closeIssueNode(state) {
  if (!state.currentIssue) {
    return { processedCount: state.processedCount + 1 };
  }
  
  console.log(`\n📝 [CLOSE_ISSUE] Updating issue #${state.currentIssue.number}...`);
  
  try {
    // Build result comment
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
    
    // Post comment
    await githubApi(`/issues/${state.currentIssue.number}/comments`, {
      method: 'POST',
      body: JSON.stringify({ body: comment })
    });
    
    // Close issue
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
    
    // Record result
    const result = {
      issueNumber: state.currentIssue.number,
      questionId: state.questionId,
      feedbackType: state.feedbackType,
      success: !state.error,
      error: state.error
    };
    
    return { 
      processedCount: state.processedCount + 1,
      results: [result],
      // Reset for next iteration
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

/**
 * Conditional: Check if more issues to process
 */
function shouldContinue(state) {
  if (state.processedCount < state.issues.length) {
    return 'parse_feedback';
  }
  return END;
}

/**
 * Conditional: Check if we have a valid issue to process
 */
function hasValidIssue(state) {
  if (state.error || !state.currentIssue) {
    return 'close_issue';
  }
  return 'fetch_question';
}

/**
 * Conditional: Check if we have a valid question
 */
function hasValidQuestion(state) {
  if (state.error || !state.question) {
    return 'close_issue';
  }
  return 'execute_action';
}

/**
 * Build and return the graph
 */
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

/**
 * Run the feedback processor pipeline
 */
export async function processFeedback(options = {}) {
  console.log('\n' + '═'.repeat(60));
  console.log('🔄 LANGGRAPH FEEDBACK PROCESSOR PIPELINE');
  console.log('═'.repeat(60));
  
  const graph = buildFeedbackProcessorGraph();
  
  const initialState = {
    maxIssues: options.maxIssues || 10
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
