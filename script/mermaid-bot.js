import {
  loadUnifiedQuestions,
  saveUnifiedQuestions,
  getAllUnifiedQuestions,
  runWithRetries,
  parseJson,
  updateUnifiedIndexFile,
  writeGitHubOutput
} from './utils.js';
import fs from 'fs';

// NFR: State tracking for resumable runs
const STATE_FILE = 'client/src/lib/questions/mermaid-bot-state.json';
const BATCH_SIZE = parseInt(process.env.BATCH_SIZE || '5', 10);
const RATE_LIMIT_MS = 2000; // NFR: Rate limiting between API calls

// Load bot state
function loadState() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch (e) {
    return {
      lastProcessedIndex: 0,
      lastRunDate: null,
      totalProcessed: 0,
      totalDiagramsAdded: 0,
      totalDiagramsImproved: 0
    };
  }
}

// Save bot state
function saveState(state) {
  state.lastRunDate = new Date().toISOString();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// NFR: Validate mermaid diagram syntax
function isValidMermaidSyntax(diagram) {
  if (!diagram || diagram.length < 20) return false;
  
  // Check for valid mermaid diagram types
  const validTypes = [
    /^(graph|flowchart)\s+(TD|TB|BT|RL|LR)/i,
    /^sequenceDiagram/i,
    /^classDiagram/i,
    /^stateDiagram/i,
    /^erDiagram/i,
    /^gantt/i,
    /^pie/i,
    /^mindmap/i
  ];
  
  const trimmed = diagram.trim();
  return validTypes.some(pattern => pattern.test(trimmed));
}

// Check if diagram needs improvement
function needsDiagramWork(question) {
  const diagram = question.diagram;
  
  // No diagram at all
  if (!diagram || diagram.length < 20) return { needs: true, reason: 'missing' };
  
  // Invalid syntax
  if (!isValidMermaidSyntax(diagram)) return { needs: true, reason: 'invalid_syntax' };
  
  // Too simple (less than 3 nodes)
  const nodeCount = (diagram.match(/\[.*?\]|\(.*?\)|{.*?}|>.*?]/g) || []).length;
  if (nodeCount < 3) return { needs: true, reason: 'too_simple' };
  
  // Generic placeholder diagram
  if (diagram.includes('Concept') && diagram.includes('Implementation') && nodeCount <= 3) {
    return { needs: true, reason: 'placeholder' };
  }
  
  return { needs: false, reason: 'valid' };
}

// Generate improved mermaid diagram using AI
async function generateDiagram(question) {
  const prompt = `You are a JSON generator. Output ONLY valid JSON, no explanations, no markdown, no text before or after.

Create a detailed Mermaid diagram for this interview question.

Question: "${question.question}"
Answer: "${question.answer?.substring(0, 200) || ''}"
Tags: ${question.tags?.slice(0, 4).join(', ') || 'technical'}

Requirements: Use flowchart TD or appropriate diagram type, include 5-10 meaningful nodes, show relationships clearly, use proper Mermaid syntax.

Output this exact JSON structure:
{"diagram":"flowchart TD\\n  A[Step 1] --> B[Step 2]\\n  B --> C[Step 3]","diagramType":"flowchart|sequence|class|state","confidence":"high|medium|low"}

IMPORTANT: Return ONLY the JSON object. No other text.`;

  const response = await runWithRetries(prompt);
  if (!response) return null;
  
  const data = parseJson(response);
  if (!data || !data.diagram) return null;
  
  // NFR: Validate the generated diagram
  if (!isValidMermaidSyntax(data.diagram)) {
    console.log('  ⚠️ Generated diagram has invalid syntax');
    return null;
  }
  
  return data;
}

// NFR: Rate limiting helper
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('=== Mermaid Bot - Add/Improve Diagrams ===\n');
  
  const state = loadState();
  const allQuestions = getAllUnifiedQuestions();
  
  console.log(`📊 Database: ${allQuestions.length} questions`);
  console.log(`📍 Last processed index: ${state.lastProcessedIndex}`);
  console.log(`📅 Last run: ${state.lastRunDate || 'Never'}`);
  console.log(`⚙️ Batch size: ${BATCH_SIZE}\n`);
  
  // Sort questions by ID for consistent ordering
  const sortedQuestions = [...allQuestions].sort((a, b) => {
    const numA = parseInt(a.id.replace(/\D/g, '')) || 0;
    const numB = parseInt(b.id.replace(/\D/g, '')) || 0;
    return numA - numB;
  });
  
  // Calculate start index (wrap around if needed)
  let startIndex = state.lastProcessedIndex;
  if (startIndex >= sortedQuestions.length) {
    startIndex = 0;
    console.log('🔄 Wrapped around to beginning\n');
  }
  
  const endIndex = Math.min(startIndex + BATCH_SIZE, sortedQuestions.length);
  const batch = sortedQuestions.slice(startIndex, endIndex);
  
  console.log(`📦 Processing: questions ${startIndex + 1} to ${endIndex} of ${sortedQuestions.length}\n`);
  
  const questions = loadUnifiedQuestions();
  const results = {
    processed: 0,
    diagramsAdded: 0,
    diagramsImproved: 0,
    skipped: 0,
    failed: 0
  };
  
  for (let i = 0; i < batch.length; i++) {
    const question = batch[i];
    const globalIndex = startIndex + i + 1;
    
    console.log(`\n--- [${globalIndex}/${sortedQuestions.length}] ${question.id} ---`);
    console.log(`Q: ${question.question.substring(0, 50)}...`);
    
    const check = needsDiagramWork(question);
    console.log(`Status: ${check.reason}`);
    
    if (!check.needs) {
      console.log('✅ Diagram is good, skipping');
      results.skipped++;
      results.processed++;
      
      // NFR: Update state after each question
      saveState({
        ...state,
        lastProcessedIndex: startIndex + i + 1,
        totalProcessed: state.totalProcessed + results.processed
      });
      continue;
    }
    
    console.log(`🔧 Generating new diagram (reason: ${check.reason})...`);
    
    // NFR: Rate limiting
    if (i > 0) await sleep(RATE_LIMIT_MS);
    
    const generated = await generateDiagram(question);
    
    if (!generated) {
      console.log('❌ Failed to generate diagram');
      results.failed++;
      results.processed++;
      
      saveState({
        ...state,
        lastProcessedIndex: startIndex + i + 1,
        totalProcessed: state.totalProcessed + results.processed
      });
      continue;
    }
    
    console.log(`✅ Generated ${generated.diagramType || 'flowchart'} diagram (confidence: ${generated.confidence})`);
    
    // Update question
    const wasEmpty = !question.diagram || question.diagram.length < 20;
    questions[question.id] = {
      ...questions[question.id],
      diagram: generated.diagram,
      lastDiagramUpdate: new Date().toISOString()
    };
    
    // NFR: Save immediately after each update
    saveUnifiedQuestions(questions);
    console.log('💾 Saved to database');
    
    if (wasEmpty) {
      results.diagramsAdded++;
    } else {
      results.diagramsImproved++;
    }
    
    results.processed++;
    
    // NFR: Update state after each question
    saveState({
      ...state,
      lastProcessedIndex: startIndex + i + 1,
      totalProcessed: state.totalProcessed + results.processed,
      totalDiagramsAdded: state.totalDiagramsAdded + results.diagramsAdded,
      totalDiagramsImproved: state.totalDiagramsImproved + results.diagramsImproved
    });
  }
  
  // Final updates
  updateUnifiedIndexFile();
  
  const newState = {
    lastProcessedIndex: endIndex >= sortedQuestions.length ? 0 : endIndex,
    lastRunDate: new Date().toISOString(),
    totalProcessed: state.totalProcessed + results.processed,
    totalDiagramsAdded: state.totalDiagramsAdded + results.diagramsAdded,
    totalDiagramsImproved: state.totalDiagramsImproved + results.diagramsImproved
  };
  saveState(newState);
  
  // Summary
  console.log('\n\n=== SUMMARY ===');
  console.log(`Processed: ${results.processed}`);
  console.log(`Diagrams Added: ${results.diagramsAdded}`);
  console.log(`Diagrams Improved: ${results.diagramsImproved}`);
  console.log(`Skipped (valid): ${results.skipped}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`\nNext run starts at: ${newState.lastProcessedIndex}`);
  console.log(`All-time diagrams: ${newState.totalDiagramsAdded + newState.totalDiagramsImproved}`);
  console.log('=== END ===\n');
  
  writeGitHubOutput({
    processed: results.processed,
    diagrams_added: results.diagramsAdded,
    diagrams_improved: results.diagramsImproved,
    skipped: results.skipped,
    failed: results.failed,
    next_index: newState.lastProcessedIndex
  });
}

main().catch(e => {
  console.error('Fatal:', e);
  writeGitHubOutput({ error: e.message, processed: 0 });
  process.exit(1);
});
