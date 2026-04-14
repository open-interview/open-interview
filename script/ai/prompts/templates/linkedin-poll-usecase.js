/**
 * LinkedIn Poll With Use Case Template
 * Takes topic/subtopic/concept + real-world use case, generates engaging poll
 * 
 * Better flow:
 * 1. Select topic, subtopic, concept
 * 2. Search for real-world use case
 * 3. Generate poll with use case as the hook
 */

import { jsonOutputRule } from './base.js';

export const schema = {
  pollQuestion: "Short rephrased question for LinkedIn poll (max 130 chars, ends with ?)",
  options: [
    "Short option A (max 30 chars)",
    "Short option B (max 30 chars)",
    "Short option C (max 30 chars)",
    "Short option D (max 30 chars)"
  ],
  correctIndex: 1,
  introText: "3-4 line engaging intro. Use the use case as the hook. End with 2-3 hashtags."
};

export function build(context) {
  const { topic, subtopic, concept, useCase, channel } = context;

  const useCaseSection = useCase ? `
REAL-WORLD USE CASE (use as the hook):
Company: ${useCase.company}
Incident/Situation: ${useCase.situation}
Challenge: ${useCase.challenge}
Solution: ${useCase.solution}
Outcome: ${useCase.outcome}
Lesson: ${useCase.lesson}
Source: ${useCase.sourceUrl}

Use this as inspiration for the hook. Make people curious about what happened and what the right answer is.` : '';

  return `You are a technical educator creating an engaging LinkedIn poll about ${concept}.

CONTEXT:
Topic: ${topic}
Subtopic: ${subtopic}
Concept: ${concept}
Channel: ${channel || 'DevOps/SRE'}

${useCaseSection}

POLL QUESTION STYLE — keep it simple and conceptual, like:
- "What's the first thing you check at 2am — dashboards, logs, or recent deployments?"
- "GitOps-first or traditional config management?"
- "Your pod is throttled. cgroups or namespaces config?"
- "Helm adds clarity or just more complexity?"

RULES:
- pollQuestion: Simple, clear fundamentals question. Max 130 characters. Must end with ?
- options: Exactly 4 options, EACH MUST BE 30 CHARACTERS OR FEWER. No labels, no markdown.
- correctIndex: 0-based index of correct option. Randomize position.
- introText: 3-4 lines with story hook. Structure:
    Line 1: Emoji + hook about the use case or real-world scenario
    Line 2: Emoji + why this concept matters day-to-day  
    Line 3: Emoji + CTA like "Vote below!" or "Your turn!"
    Line 4: 2-3 relevant hashtags
  Use varied emojis (🚀 ⚡ 🔥 🎯 💡 🛠️ 🤔 👇 📊 💭). Do NOT reveal the answer.

EXAMPLE INTRO WITH USE CASE HOOK:
"Netflix once spent 3 days debugging a throttled service. The culprit? Nobody knew how cgroups actually work.
⚡ Misunderstanding cgroups causes production incidents every week.
👇 Vote and comment your worst cgroups moment!
#Kubernetes #SRE #DevOps"

${jsonOutputRule}

Output this exact JSON:
${JSON.stringify(schema, null, 2)}`;
}

export default { schema, build };
