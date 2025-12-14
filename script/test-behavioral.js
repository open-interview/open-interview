// Test behavioral channel loading
const allQuestionsData = require('../client/src/lib/questions/all-questions.json');
const channelMappingsData = require('../client/src/lib/questions/channel-mappings.json');

const questionsById = allQuestionsData.questions || {};
const channelMappings = channelMappingsData.channels || {};

// Build questions for behavioral channel
const channelId = 'behavioral';
const mapping = channelMappings[channelId];

if (!mapping) {
  console.log('No mapping found for behavioral');
  process.exit(1);
}

const questionIds = new Set();
Object.values(mapping.subChannels || {}).forEach(ids => {
  ids.forEach(id => questionIds.add(id));
});

console.log('Question IDs for behavioral:', Array.from(questionIds));

const questions = Array.from(questionIds).map(id => {
  const q = questionsById[id];
  if (!q) return null;
  return { ...q, channel: channelId };
}).filter(q => q !== null);

console.log('Questions count:', questions.length);
if (questions.length > 0) {
  console.log('First question:', questions[0].question.substring(0, 80) + '...');
}
