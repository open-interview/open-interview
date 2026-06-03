/**
 * Elite Blog Generation Graph (LangGraph)
 *
 * LangGraph pipeline that takes a discovered topic and produces
 * a validated blog post ready for MDX serialization.
 *
 * Flow:
 *   find_case → generate_content → validate_quality → finalize → end
 */

import fs from 'fs';
import path from 'path';
import { StateGraph, END, START } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import ai from '../index.js';
import { validateBlogQuality } from '../services/blog-quality-gates.js';
import { serializeMD, validateMD } from '../utils/md-serializer.js';

const EliteBlogState = Annotation.Root({
  topic: Annotation({ reducer: (_, b) => b, default: () => null }),

  realWorldCase: Annotation({ reducer: (_, b) => b, default: () => null }),
  caseScore: Annotation({ reducer: (_, b) => b, default: () => 0 }),
  caseError: Annotation({ reducer: (_, b) => b, default: () => null }),

  blogContent: Annotation({ reducer: (_, b) => b, default: () => null }),
  blogData: Annotation({ reducer: (_, b) => b, default: () => null }),

  qualityResults: Annotation({ reducer: (_, b) => b, default: () => null }),
  qualityPassed: Annotation({ reducer: (_, b) => b, default: () => false }),

  mdxContent: Annotation({ reducer: (_, b) => b, default: () => null }),
  mdxValidation: Annotation({ reducer: (_, b) => b, default: () => null }),

  status: Annotation({ reducer: (_, b) => b, default: () => 'pending' }),
  error: Annotation({ reducer: (_, b) => b, default: () => null }),
});

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 80);
}

async function findCaseNode(state) {
  const topic = state.topic;
  console.log(`\n🔍 [FIND_CASE] Finding real-world case for: ${topic.question.substring(0, 60)}...`);

  try {
    const result = await ai.run('realWorldCase', {
      question: topic.question,
      answer: topic.answer,
      explanation: topic.explanation,
      channel: topic.channel,
      tags: topic.tags,
      companies: topic.companies,
    });

    const rwc = result.company ? {
      company: result.company,
      incident: result.incident || result.scenario || '',
      year: result.year || '',
      impact: result.impact || result.outcome || '',
      sourceUrl: result.sourceUrl || '',
      scenario: result.scenario || '',
      challenge: result.challenge || '',
      solution: result.solution || '',
      outcome: result.outcome || '',
      lesson: result.lesson || '',
    } : null;

    console.log(`   Found case: ${result.company || 'none'} (score: ${result.interestScore || 0}/10)`);
    return {
      realWorldCase: rwc,
      caseScore: result.interestScore || 0,
      caseError: rwc ? null : 'No company found',
    };
  } catch (error) {
    console.log(`   ❌ Failed: ${error.message}`);
    return { realWorldCase: null, caseScore: 0, caseError: error.message };
  }
}

async function generateContentNode(state) {
  const topic = state.topic;
  const rwc = state.realWorldCase;

  if (!rwc) {
    console.log(`   ⏭️ No real-world case available, skipping content generation`);
    return { status: 'skip', error: 'No real-world case found' };
  }

  console.log(`\n📝 [GENERATE_CONTENT] Creating blog content...`);

  let result;
  try {
    result = await ai.run('blog', {
      question: topic.question,
      answer: topic.answer,
      explanation: topic.explanation,
      channel: topic.channel,
      difficulty: topic.difficulty,
      tags: topic.tags,
      realWorldCase: rwc,
    });
  } catch (parseErr) {
    const blogOutputPath = path.resolve(process.cwd(), 'blog-output.json');
    if (fs.existsSync(blogOutputPath)) {
      try {
        result = JSON.parse(fs.readFileSync(blogOutputPath, 'utf-8'));
        console.log(`   📖 Read blog data from ${blogOutputPath}`);
      } catch (readErr) {
        console.log(`   ❌ Failed to parse blog-output.json: ${readErr.message}`);
        return { error: readErr.message, status: 'error' };
      }
    } else {
      console.log(`   ❌ AI parse failed and no blog-output.json: ${parseErr.message}`);
      return { error: parseErr.message, status: 'error' };
    }
  }

  if (!result || !result.title) {
    console.log(`   ❌ Blog content missing required fields`);
    return { error: 'Blog content missing required fields', status: 'error' };
  }

  console.log(`   Title: ${result.title}`);
  console.log(`   Sections: ${result.sections?.length || 0}`);
  console.log(`   Sources: ${result.references?.length || 0}`);

  const titleSlug = slugify(result.title || 'untitled').substring(0, 30);
  const blogId = `blog-${Date.now()}-${titleSlug}`;

  const blogData = {
    id: blogId,
    blogTitle: result.title,
    blogSlug: slugify(result.title),
    channel: topic.channel,
    category: topic.channelName || topic.channel,
    difficulty: topic.difficulty,
    tags: topic.tags,
    blogIntro: result.introduction || '',
    blogSections: (result.sections || []).map(s => ({
      heading: s.heading || '',
      content: s.content || '',
    })),
    blogConclusion: result.conclusion || '',
    blogMeta: result.metaDescription || '',
    diagram: result.diagram || '',
    diagramType: result.diagramType || '',
    diagramLabel: result.diagramLabel || 'Architecture & Flow',
    realWorldExample: {
      company: rwc.company,
      scenario: rwc.scenario,
      challenge: rwc.challenge,
      solution: rwc.solution,
      outcome: rwc.outcome,
      lesson: rwc.lesson,
      sourceUrl: rwc.sourceUrl,
    },
    codeExample: result.codeExample || null,
    sources: (result.references || []).slice(0, 12).map((r, i) => ({
      number: i + 1,
      title: r.title || '',
      url: r.url || '',
      type: r.type || 'article',
    })),
    images: (result.images || []).slice(0, 3).map(img => ({
      url: img.url || '',
      alt: img.alt || '',
      caption: img.caption || '',
      placement: img.placement || 'after-intro',
    })),
    socialSnippet: result.socialSnippet || null,
    questionId: topic.id,
    question: topic.question,
    answer: topic.answer,
    createdAt: new Date().toISOString(),
  };

  const qualityContent = {
    id: blogId,
    title: result.title,
    introduction: result.introduction || '',
    sections: (result.sections || []).map(s => ({
      heading: s.heading || '',
      content: s.content || '',
    })),
    conclusion: result.conclusion || '',
    tags: topic.tags,
    realWorldCase: {
      company: rwc.company,
      incident: rwc.incident || rwc.scenario,
      sourceUrl: rwc.sourceUrl,
    },
    diagram: result.diagram || '',
    codeExample: result.codeExample || null,
    references: (result.references || []).slice(0, 12),
  };

  return { blogContent: qualityContent, blogData };

}

async function validateQualityNode(state) {
  if (!state.blogContent) {
    return { qualityPassed: false, qualityResults: null };
  }

  console.log(`\n🚦 [VALIDATE_QUALITY] Running quality gates...`);

  try {
    const qualityResults = await validateBlogQuality(state.blogContent, {
      question: state.topic.question,
      channel: state.topic.channel,
      tags: state.topic.tags,
    });

    const passed = qualityResults.passed || qualityResults.overallScore >= 85;
    const status = qualityResults.passed ? 'PASSED' : (qualityResults.overallScore >= 85 ? 'PASSED (overridden)' : 'FAILED');
    console.log(`   ${passed ? '✅' : '❌'} ${status} — Score: ${qualityResults.overallScore.toFixed(1)}/100`);

    return { qualityResults, qualityPassed: passed };
  } catch (error) {
    console.log(`   ❌ Quality gate error: ${error.message}`);
    return { qualityPassed: false, qualityResults: { error: error.message } };
  }
}

function finalizeNode(state) {
  console.log(`\n🎯 [FINALIZE] Packaging blog output...`);

  if (!state.blogData || !state.qualityPassed) {
    const reason = !state.blogData ? 'No content generated' : 'Quality gates failed';
    console.log(`   ⏭️ ${reason}`);
    return {
      status: 'skip',
      skipReason: reason,
    };
  }

  try {
    const post = state.blogData;
    const question = { question: state.topic.question, answer: state.topic.answer };
    const mdxContent = serializeMD(post, question);
    const mdxValidation = validateMD(mdxContent);

    if (mdxValidation.valid) {
      console.log(`   ✅ MDX serialization valid`);
    } else {
      console.log(`   ⚠️ MDX validation warnings: ${mdxValidation.errors.length} errors, ${mdxValidation.warnings.length} warnings`);
    }

    return {
      mdxContent,
      mdxValidation,
      status: 'completed',
    };
  } catch (error) {
    console.log(`   ❌ Finalize error: ${error.message}`);
    return { error: error.message, status: 'error' };
  }
}

function routeAfterQuality(state) {
  if (state.status === 'skip' || state.status === 'error') {
    return 'finalize';
  }
  if (!state.qualityPassed) {
    return 'finalize';
  }
  return 'finalize';
}

export function createEliteBlogGraph() {
  const graph = new StateGraph(EliteBlogState);

  graph.addNode('find_case', findCaseNode);
  graph.addNode('generate_content', generateContentNode);
  graph.addNode('validate_quality', validateQualityNode);
  graph.addNode('finalize', finalizeNode);

  graph.addEdge(START, 'find_case');
  graph.addEdge('find_case', 'generate_content');
  graph.addEdge('generate_content', 'validate_quality');
  graph.addConditionalEdges('validate_quality', routeAfterQuality, {
    finalize: 'finalize',
  });
  graph.addEdge('finalize', END);

  return graph.compile();
}

let _compiledGraph = null;
export async function generateEliteBlogPost(topic) {
  const graph = _compiledGraph ??= createEliteBlogGraph();

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🚀 ELITE BLOG GENERATION`);
  console.log(`═`.repeat(60));
  console.log(`Topic: ${topic.question?.substring(0, 60)}...`);
  console.log(`Channel: ${topic.channel}  Difficulty: ${topic.difficulty}`);

  const initialState = {
    topic,
    realWorldCase: null,
    caseScore: 0,
    caseError: null,
    blogContent: null,
    blogData: null,
    qualityResults: null,
    qualityPassed: false,
    mdxContent: null,
    mdxValidation: null,
    status: 'pending',
    error: null,
  };

  try {
    let finalResult = initialState;

    for await (const step of await graph.stream(initialState)) {
      const [, nodeState] = Object.entries(step)[0];
      finalResult = { ...finalResult, ...nodeState };
    }

    console.log(`\n${'═'.repeat(60)}`);
    console.log(`📋 RESULT: ${finalResult.status}`);
    console.log(`═`.repeat(60));

    if (finalResult.status === 'completed') {
      return {
        success: true,
        blogContent: finalResult.blogData,
        qualityPassed: finalResult.qualityPassed,
        mdxContent: finalResult.mdxContent,
        mdxValidation: finalResult.mdxValidation,
        qualityResults: finalResult.qualityResults,
        qualityPassed: finalResult.qualityPassed,
      };
    }

    return {
      success: false,
      error: finalResult.error || finalResult.skipReason || 'Unknown error',
      blogContent: finalResult.blogContent,
    };
  } catch (error) {
    console.error(`   Pipeline error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

export default { createEliteBlogGraph, generateEliteBlogPost };
