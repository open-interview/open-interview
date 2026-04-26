const fs = require('fs');

function analyzeFile(filename) {
  const content = fs.readFileSync('data/questions/' + filename, 'utf8');
  const questions = JSON.parse(content);
  
  const issues = [];
  const questionTexts = new Map();
  
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const idx = i;
    
    // Check missing fields
    if (!q.question || q.question.trim() === '') {
      issues.push({index: idx, type: 'missing_question', description: 'Empty or missing question field'});
    }
    if (!q.answer || q.answer.trim() === '') {
      issues.push({index: idx, type: 'missing_answer', description: 'Empty or missing answer field'});
    }
    
    // Check too-short answers (< 20 chars)
    if (q.answer && q.answer.length < 20) {
      issues.push({index: idx, type: 'short_answer', description: 'Answer too short (<20 chars): ' + q.answer.substring(0, 30) + '...'});
    }
    
    // Check duplicate questions
    const qText = q.question ? q.question.trim() : '';
    if (qText) {
      if (questionTexts.has(qText)) {
        issues.push({index: idx, type: 'duplicate_question', description: 'Duplicate of question at index ' + questionTexts.get(qText)});
      } else {
        questionTexts.set(qText, idx);
      }
    }
    
    // Check unclosed backticks in answer
    if (q.answer) {
      const bt = (q.answer.match(/`/g) || []).length;
      if (bt % 2 !== 0) {
        issues.push({index: idx, type: 'unclosed_backtick', description: 'Unclosed backtick in answer'});
      }
      const cb = (q.answer.match(/```/g) || []).length;
      if (cb % 2 !== 0) {
        issues.push({index: idx, type: 'unclosed_code_block', description: 'Unclosed code block in answer'});
      }
    }
    
    // Check explanation field
    if (q.explanation) {
      const bt = (q.explanation.match(/`/g) || []).length;
      if (bt % 2 !== 0) {
        issues.push({index: idx, type: 'unclosed_backtick_explanation', description: 'Unclosed backtick in explanation'});
      }
      const cb = (q.explanation.match(/```/g) || []).length;
      if (cb % 2 !== 0) {
        issues.push({index: idx, type: 'unclosed_code_explanation', description: 'Unclosed code block in explanation'});
      }
    }
  }
  
  return {
    file: filename,
    questions_scanned: questions.length,
    issues: issues
  };
}

const files = ['cba.json', 'cca.json', 'cgoa.json'];
const results = files.map(f => analyzeFile(f));
console.log(JSON.stringify(results, null, 2));