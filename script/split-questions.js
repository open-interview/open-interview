import fs from 'fs';
import path from 'path';

const questions = JSON.parse(fs.readFileSync('client/src/lib/questions.json', 'utf8'));

// Group by channel
const byChannel = {};
questions.forEach(q => {
  if (!byChannel[q.channel]) byChannel[q.channel] = [];
  byChannel[q.channel].push(q);
});

// Create questions directory
const questionsDir = 'client/src/lib/questions';
fs.mkdirSync(questionsDir, { recursive: true });

// Write each channel file
Object.entries(byChannel).forEach(([channel, qs]) => {
  fs.writeFileSync(path.join(questionsDir, `${channel}.json`), JSON.stringify(qs, null, 2));
  console.log(`${channel}: ${qs.length} questions`);
});

// Create index file
const channels = Object.keys(byChannel);
const imports = channels.map(ch => 
  `import ${ch.replace(/-/g, '_')} from "./${ch}.json";`
).join('\n');

const exports = channels.map(ch => 
  `  "${ch}": ${ch.replace(/-/g, '_')}`
).join(',\n');

const indexContent = `${imports}

export const questionsByChannel: Record<string, any[]> = {
${exports}
};

export const allQuestions = Object.values(questionsByChannel).flat();
`;

fs.writeFileSync(path.join(questionsDir, 'index.ts'), indexContent);
console.log('\nCreated index.ts');
