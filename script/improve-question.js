import fs from 'fs';
import { spawn } from 'child_process';

const QUESTIONS_DIR = 'client/src/lib/questions';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 10000;
const TIMEOUT_MS = 120000;

function loadAllQuestions() {
  const all = [];
  try {
    fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json')).forEach(f => {
      try {
        const questions = JSON.parse(fs.readFileSync(`${QUESTIONS_DIR}/${f}`, 'utf8'));
        questions.forEach(q => all.push({ ...q, _file: f }));
      } catch (e) {}
    });
  } catch (e) {}
  return all;
}

function runOpenCode(prompt) {
  return new Promise((resolve) => {
    let output = '';
    let resolved = false;
    
    const proc = spawn('opencode', ['run', '--format', 'json', prompt], {
      timeout: TIMEOUT_MS,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        proc.kill('SIGTERM');
        resolve(null);
      }
    }, TIMEOUT_MS);
    
    proc.stdout.on('data', (data) => { output += data.toString(); });
    proc.stderr.on('data', (data) => { output += data.toString(); });
    
    proc.on('close', () => {
      clearTimeout(timeout);
      if (!resolved) {
        resolved = true;
        resolve(output || null);
      }
    });
    
    proc.on('error', (err) => {
      clearTimeout(timeout);
      if (!resolved) {
        resolved = true;
        console.log(`Process error: ${err.message}`);
        resolve(null);
      }
    });
  });
}

async function runWithRetries(prompt) {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    console.log(`\n[Attempt ${attempt}/${MAX_RETRIES}] Calling OpenCode CLI...`);
    const result = await runOpenCode(prompt);
    if (result) return result;
    
    if (attempt < MAX_RETRIES) {
      console.log(`Failed. Waiting ${RETRY_DELAY_MS/1000}s before retry...`);
      await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
    }
  }
  return null;
}

function extractTextFromJsonEvents(output) {
  if (!output) return null;
  const lines = output.split('\n').filter(l => l.trim());
  let fullText = '';
  for (const line of lines) {
    try {
      const event = JSON.parse(line);
      if (event.type === 'text' && event.part?.text) {
        fullText += event.part.text;
      }
    } catch(e) {}
  }
  return fullText || output;
}

function parseJson(response) {
  if (!response) return null;
  const text = extractTextFromJsonEvents(response);
  try { return JSON.parse(text.trim()); } catch (e) {}
  const patterns = [/```json\s*([\s\S]*?)\s*```/, /```\s*([\s\S]*?)\s*```/, /(\{[\s\S]*\})/];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) { try { return JSON.parse(m[1].trim()); } catch (e) {} }
  }
  return null;
}

function needsImprovement(q) {
  const issues = [];

  // Check answer length (should be concise, 50-150 chars ideal)
  if (q.answer.length < 30) issues.push('answer_too_short');
  if (q.answer.length > 200) issues.push('answer_too_long');

  // Check explanation length (should be comprehensive, 200-1000 chars)
  if (q.explanation.length < 100) issues.push('explanation_too_short');

  // Check for missing or basic diagram
  if (!q.diagram) issues.push('no_diagram');
  else if (q.diagram.length < 50) issues.push('diagram_too_simple');
  else if (!q.diagram.includes('-->') && !q.diagram.includes('---')) issues.push('diagram_no_connections');

  // Check question quality
  if (q.question.length < 20) issues.push('question_too_short');
  if (!q.question.endsWith('?')) issues.push('question_no_question_mark');

  // Check for truncated content (common issue)
  if (q.answer.endsWith('...') || q.explanation.endsWith('...')) issues.push('truncated_content');

  return issues;
}

function updateIndexFile() {
  const files = fs.readdirSync(QUESTIONS_DIR).filter(f => f.endsWith('.json'));
  const channels = files.map(f => f.replace('.json', ''));
  const imports = channels.map(c => `import ${c.replace(/-/g, '_')} from "./${c}.json";`).join('\n');
  const exports = channels.map(c => `  "${c}": ${c.replace(/-/g, '_')}`).join(',\n');
  fs.writeFileSync(`${QUESTIONS_DIR}/index.ts`, `${imports}\n\nexport const questionsByChannel: Record<string, any[]> = {\n${exports}\n};\n\nexport const allQuestions = Object.values(questionsByChannel).flat();\n`);
}

async function main() {
  console.log('=== Question Improvement Bot (OpenCode Free Tier) ===\n');

  const allQuestions = loadAllQuestions();
  console.log(`Loaded ${allQuestions.length} questions\n`);

  if (allQuestions.length === 0) {
    console.log('No questions found. Exiting.');
    process.exit(0);
  }

  // Find questions that need improvement
  const questionsWithIssues = allQuestions
    .map(q => ({ question: q, issues: needsImprovement(q) }))
    .filter(x => x.issues.length > 0);

  console.log(`Found ${questionsWithIssues.length} questions with potential improvements\n`);

  if (questionsWithIssues.length === 0) {
    console.log('All questions look good! No improvements needed.');
    process.exit(0);
  }

  // Pick a random question to improve
  const target = questionsWithIssues[Math.floor(Math.random() * questionsWithIssues.length)];
  const q = target.question;

  console.log(`Selected question: ${q.id}`);
  console.log(`Issues: ${target.issues.join(', ')}`);
  console.log(`Current question: ${q.question.substring(0, 80)}...`);

  const prompt = `Improve this technical interview question. Fix these issues: ${target.issues.join(', ')}. Current: Question="${q.question}" Answer="${q.answer}" Explanation="${q.explanation}" Diagram="${q.diagram || 'MISSING'}". Return ONLY valid JSON: {"question":"improved question ending with ?","answer":"concise answer 50-150 chars","explanation":"markdown explanation with bullets","diagram":"mermaid graph TD with 3+ nodes"}`;

  const response = await runWithRetries(prompt);

  if (!response) {
    console.log('\n❌ OpenCode failed. No improvements made.');
    process.exit(0);
  }

  const improved = parseJson(response);

  if (!improved || !improved.question || !improved.answer || !improved.explanation) {
    console.log('\n❌ Invalid response format. No improvements made.');
    console.log('Response preview:', response.substring(0, 300));
    process.exit(0);
  }

  // Update the question in its file
  const filePath = `${QUESTIONS_DIR}/${q._file}`;
  const fileQuestions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const idx = fileQuestions.findIndex(fq => fq.id === q.id);

  if (idx === -1) {
    console.log('\n❌ Could not find question in file. No improvements made.');
    process.exit(0);
  }

  // Apply improvements
  fileQuestions[idx] = {
    ...fileQuestions[idx],
    question: improved.question || fileQuestions[idx].question,
    answer: (improved.answer || fileQuestions[idx].answer).substring(0, 200),
    explanation: improved.explanation || fileQuestions[idx].explanation,
    diagram: improved.diagram || fileQuestions[idx].diagram || 'graph TD\n    A[Concept] --> B[Implementation]'
  };

  fs.writeFileSync(filePath, JSON.stringify(fileQuestions, null, 2));
  updateIndexFile();

  console.log('\n✅ Question improved!');
  console.log(`ID: ${q.id}`);
  console.log(`File: ${q._file}`);
  console.log(`Fixed issues: ${target.issues.join(', ')}`);

  const out = process.env.GITHUB_OUTPUT;
  if (out) {
    fs.appendFileSync(out, `improved_id=${q.id}\n`);
    fs.appendFileSync(out, `improved_file=${q._file}\n`);
  }
}

main().catch(e => { console.error('Fatal:', e); process.exit(1); });
