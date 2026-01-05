#!/usr/bin/env node
/**
 * Interview Theater Generator
 * 
 * Creates immersive, story-driven interview simulations where users can
 * watch AI-generated interviews and learn from different approaches.
 * 
 * Usage:
 *   node script/generate-interview-theater.js --topic "Design a URL Shortener" --level senior
 *   node script/generate-interview-theater.js --topic "Explain CAP Theorem" --style behavioral
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Parse command line arguments
const args = process.argv.slice(2);
let topic = 'Design a Rate Limiter';
let candidateLevel = 'mid';
let interviewStyle = 'technical';
let includeFailure = false;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--topic' && args[i + 1]) {
    topic = args[i + 1];
    i++;
  } else if (args[i] === '--level' && args[i + 1]) {
    candidateLevel = args[i + 1];
    i++;
  } else if (args[i] === '--style' && args[i + 1]) {
    interviewStyle = args[i + 1];
    i++;
  } else if (args[i] === '--include-failure') {
    includeFailure = true;
  } else if (args[i] === '--help') {
    console.log(`
🎭 Interview Theater Generator

Creates immersive, story-driven interview simulations.

Usage:
  node script/generate-interview-theater.js [options]

Options:
  --topic <string>       Interview topic (default: "Design a Rate Limiter")
  --level <string>       Candidate level: junior, mid, senior, staff (default: mid)
  --style <string>       Interview style: technical, behavioral, system-design, coding (default: technical)
  --include-failure      Include a failure path scenario
  --help                 Show this help message

Examples:
  node script/generate-interview-theater.js --topic "Design Twitter" --level senior --style system-design
  node script/generate-interview-theater.js --topic "Explain Promises" --level junior --style technical
`);
    process.exit(0);
  }
}

function generateFallbackEpisode() {
  return JSON.stringify({
    episode: {
      title: `The ${topic} Challenge`,
      synopsis: `Watch as a ${candidateLevel}-level candidate tackles one of the most common interview questions. Will they succeed or stumble? Learn from their journey.`,
      duration_estimate: "15-20 min read",
      difficulty: candidateLevel === 'senior' ? 'advanced' : 'intermediate',
      tags: [interviewStyle, "interview-prep", "career"]
    },
    characters: {
      candidate: {
        name: "Alex Chen",
        background: `${candidateLevel.charAt(0).toUpperCase() + candidateLevel.slice(1)} Software Engineer with 5 years of experience`,
        strengths: ["Problem decomposition", "Clear communication", "Technical depth"],
        weaknesses: ["Sometimes over-engineers", "Can be nervous initially"],
        personality: "Thoughtful and methodical, gains confidence as the interview progresses"
      },
      interviewer: {
        name: "Sarah Martinez",
        role: "Senior Staff Engineer at TechCorp",
        style: "Collaborative but probing, looks for depth over breadth"
      }
    },
    scenes: [
      {
        scene_number: 1,
        title: "The Opening",
        setting: "A bright, modern conference room with a whiteboard. Virtual meeting setup.",
        dialogue: [
          {
            speaker: "interviewer",
            text: `Thanks for joining today, Alex. I'm excited to discuss ${topic} with you. Before we dive in, tell me a bit about your background.`,
            subtext: "Evaluating communication skills and setting the candidate at ease",
            coaching_note: "Notice how the interviewer creates a welcoming atmosphere first"
          },
          {
            speaker: "candidate",
            text: "Thanks Sarah! I've been working as a software engineer for about 5 years, most recently at a fintech startup where I led the backend team.",
            thought_bubble: "Keep it brief, she wants to get to the technical stuff",
            technique_used: "Concise introduction with relevant highlights"
          },
          {
            speaker: "interviewer",
            text: `Great background. Let's jump into the main topic: ${topic}. How would you approach this?`,
            subtext: "Testing initial problem-solving approach",
            coaching_note: "The interviewer is looking for structured thinking from the start"
          }
        ],
        decision_point: {
          question: "How should Alex start their response?",
          options: [
            { choice: "Immediately start listing technical solutions", outcome: "Shows enthusiasm but misses the chance to clarify requirements", score_impact: "+1 technical, -2 communication" },
            { choice: "Ask clarifying questions first", outcome: "Demonstrates mature problem-solving approach", score_impact: "+2 technical, +2 communication" }
          ],
          best_choice: "B - Always clarify requirements before diving into solutions"
        },
        key_insights: ["First impressions matter - be confident but not arrogant", "Clarifying questions show maturity and prevent wasted effort"]
      },
      {
        scene_number: 2,
        title: "Deep Dive",
        setting: "Alex is now at the whiteboard, sketching out a design",
        dialogue: [
          { speaker: "candidate", text: "Let me start by outlining the key requirements I'm hearing: we need to handle X, Y, and Z. Is that correct?", thought_bubble: "Make sure we're aligned before I invest time in a solution", technique_used: "Requirements confirmation" },
          { speaker: "interviewer", text: "Yes, and also consider that we might need to scale to 10x the current load.", subtext: "Adding complexity to see how they adapt", coaching_note: "Interviewers often add constraints mid-discussion - stay flexible" },
          { speaker: "candidate", text: "That's a great point. Let me think about how that changes my approach... *pauses* I think we'd need to consider horizontal scaling here.", thought_bubble: "Don't panic, this is expected. Think out loud.", technique_used: "Thinking out loud under pressure" }
        ],
        decision_point: {
          question: "How should Alex handle the new scaling requirement?",
          options: [
            { choice: "Stick with the original design and mention scaling later", outcome: "Might seem inflexible or miss important considerations", score_impact: "-1 technical, -1 adaptability" },
            { choice: "Acknowledge the constraint and adjust the approach", outcome: "Shows adaptability and real-world thinking", score_impact: "+2 technical, +2 adaptability" }
          ],
          best_choice: "B - Embrace changing requirements as part of the process"
        },
        key_insights: ["Real interviews often have evolving requirements", "Adaptability is as important as technical knowledge"]
      },
      {
        scene_number: 3,
        title: "The Curveball",
        setting: "30 minutes into the interview, tension is building",
        dialogue: [
          { speaker: "interviewer", text: "What happens if your primary database goes down? How does your system handle that?", subtext: "Testing failure mode thinking and operational awareness", coaching_note: "Failure scenarios reveal depth of understanding" },
          { speaker: "candidate", text: "Hmm, that's a critical scenario. *takes a breath* Let me think through this...", thought_bubble: "I haven't fully considered this. Stay calm, reason through it.", technique_used: "Buying time while thinking" },
          { speaker: "candidate", text: "We'd need redundancy - a replica database with automatic failover. But there's a trade-off with consistency during the switch...", thought_bubble: "Good, I'm showing I understand the trade-offs", technique_used: "Discussing trade-offs explicitly" }
        ],
        decision_point: {
          question: "Alex isn't 100% sure about failover mechanisms. What should they do?",
          options: [
            { choice: "Pretend to know and give a vague answer", outcome: "Interviewer will likely probe deeper and expose the gap", score_impact: "-3 honesty, -2 technical" },
            { choice: "Admit uncertainty but reason through it logically", outcome: "Shows intellectual honesty and problem-solving ability", score_impact: "+2 honesty, +1 technical" }
          ],
          best_choice: "B - Honesty about knowledge gaps, combined with logical reasoning, is valued"
        },
        key_insights: ["It's okay to not know everything", "How you handle uncertainty matters more than having all answers", "Discussing trade-offs shows senior-level thinking"]
      }
    ],
    climax: {
      title: "The Critical Moment",
      description: "Sarah asks a challenging follow-up that tests the limits of Alex's knowledge",
      candidate_approach: "Alex admits uncertainty but reasons through the problem logically",
      what_went_well: ["Honest about knowledge gaps", "Used first principles to reason through unknowns", "Maintained composure under pressure"],
      what_could_improve: ["Could have drawn more from past experience", "Missed an opportunity to discuss trade-offs earlier"],
      alternative_approaches: [{ approach: "Reference a similar problem from past experience", pros: ["Shows practical experience", "Builds credibility"], cons: ["Might not directly apply", "Could seem like deflection"] }]
    },
    resolution: {
      outcome: "hire",
      feedback_given: "Strong problem-solving skills, good communication, would benefit from more system design practice",
      candidate_reflection: "I should have been more confident in my initial approach",
      viewer_takeaways: ["Always clarify requirements before solving", "It's okay to not know everything - show your reasoning process", "Adaptability and communication matter as much as technical skills"]
    },
    bonus_content: {
      what_if_scenarios: [{ scenario: "What if Alex had 10 years of experience instead of 5?", different_outcome: "Would likely dive deeper into edge cases and production concerns" }],
      interviewer_rubric: { technical_depth: "Understanding of core concepts and ability to go deep when probed", communication: "Clear explanation of thought process, good use of diagrams", problem_solving: "Structured approach, handles ambiguity well" },
      practice_exercises: [
        { exercise: `Explain ${topic} to a non-technical stakeholder in 2 minutes`, success_criteria: "Clear, jargon-free, focuses on business value" },
        { exercise: "List 5 potential failure modes and how you'd handle them", success_criteria: "Shows depth of understanding and operational awareness" }
      ]
    }
  }, null, 2);
}


function generateTheaterHTML(episode) {
  const ep = episode.episode || {};
  const chars = episode.characters || {};
  const scenes = episode.scenes || [];
  const climax = episode.climax || {};
  const resolution = episode.resolution || {};
  const bonus = episode.bonus_content || {};
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${ep.title || 'Interview Theater'} | Reel LearnHub</title>
  <style>
    :root { --bg:#0a0a0f;--bg-card:#12121a;--bg-elevated:#1a1a24;--text:#f0f0f5;--text-secondary:#a0a0b0;--text-muted:#606070;--accent:#6366f1;--accent-light:#818cf8;--border:#2a2a3a;--success:#22c55e;--warning:#f59e0b;--error:#ef4444;--gradient:linear-gradient(135deg,#6366f1 0%,#8b5cf6 50%,#a855f7 100%); }
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--text);line-height:1.7;min-height:100vh}
    .theater-container{max-width:900px;margin:0 auto;padding:2rem}
    .episode-header{text-align:center;padding:3rem 0;border-bottom:1px solid var(--border);margin-bottom:3rem}
    .episode-badge{display:inline-flex;align-items:center;gap:.5rem;background:var(--gradient);color:white;padding:.5rem 1rem;border-radius:100px;font-size:.875rem;font-weight:600;margin-bottom:1.5rem}
    .episode-title{font-size:2.5rem;font-weight:700;letter-spacing:-.03em;margin-bottom:1rem;background:var(--gradient);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
    .episode-synopsis{font-size:1.25rem;color:var(--text-secondary);max-width:600px;margin:0 auto 1.5rem}
    .episode-meta{display:flex;justify-content:center;gap:2rem;flex-wrap:wrap}
    .meta-item{display:flex;align-items:center;gap:.5rem;color:var(--text-muted);font-size:.875rem}
    .characters-section{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1.5rem;margin-bottom:3rem}
    .character-card{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:1.5rem}
    .character-header{display:flex;align-items:center;gap:1rem;margin-bottom:1rem}
    .character-avatar{width:60px;height:60px;border-radius:50%;background:var(--gradient);display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700}
    .character-name{font-size:1.25rem;font-weight:600}
    .character-role{color:var(--text-muted);font-size:.875rem}
    .character-traits{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem}
    .trait{background:var(--bg-elevated);padding:.25rem .75rem;border-radius:100px;font-size:.75rem;color:var(--text-secondary)}
    .trait.strength{border-left:3px solid var(--success)}
    .trait.weakness{border-left:3px solid var(--warning)}
    .scene{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:2rem;margin-bottom:2rem}
    .scene-header{display:flex;align-items:center;gap:1rem;margin-bottom:1.5rem}
    .scene-number{width:40px;height:40px;background:var(--gradient);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700}
    .scene-title{font-size:1.5rem;font-weight:600}
    .scene-setting{color:var(--text-muted);font-style:italic;margin-bottom:1.5rem;padding:1rem;background:var(--bg-elevated);border-radius:8px}
    .dialogue-item{margin-bottom:1.5rem;padding-left:1rem;border-left:3px solid var(--border)}
    .dialogue-item.interviewer{border-left-color:var(--accent)}
    .dialogue-item.candidate{border-left-color:var(--success)}
    .dialogue-speaker{font-weight:600;text-transform:uppercase;font-size:.75rem;letter-spacing:.05em;margin-bottom:.5rem}
    .dialogue-speaker.interviewer{color:var(--accent)}
    .dialogue-speaker.candidate{color:var(--success)}
    .dialogue-text{font-size:1.1rem;margin-bottom:.5rem}
    .dialogue-meta{display:flex;flex-wrap:wrap;gap:1rem;margin-top:.75rem}
    .thought-bubble,.subtext,.coaching-note,.technique{font-size:.8rem;padding:.5rem .75rem;border-radius:8px;display:inline-flex;align-items:center;gap:.5rem}
    .thought-bubble{background:rgba(34,197,94,.1);color:var(--success);font-style:italic}
    .subtext{background:rgba(99,102,241,.1);color:var(--accent-light)}
    .coaching-note{background:rgba(245,158,11,.1);color:var(--warning)}
    .technique{background:var(--bg-elevated);color:var(--text-secondary)}
    .decision-point{background:var(--bg-elevated);border:2px solid var(--accent);border-radius:12px;padding:1.5rem;margin:1.5rem 0}
    .decision-title{font-size:1.1rem;font-weight:600;color:var(--accent-light);margin-bottom:1rem}
    .decision-options{display:flex;flex-direction:column;gap:1rem}
    .option{background:var(--bg-card);border:1px solid var(--border);border-radius:8px;padding:1rem;cursor:pointer;transition:all .2s}
    .option:hover{border-color:var(--accent);transform:translateX(4px)}
    .option.revealed{pointer-events:none}
    .option.best{border-color:var(--success);background:rgba(34,197,94,.1)}
    .option.worse{opacity:.6}
    .option-choice{font-weight:500;margin-bottom:.5rem}
    .option-outcome{font-size:.875rem;color:var(--text-secondary);display:none}
    .option.revealed .option-outcome{display:block}
    .option-score{font-size:.75rem;color:var(--text-muted);margin-top:.5rem}
    .best-choice{margin-top:1rem;padding:1rem;background:rgba(34,197,94,.1);border-radius:8px;color:var(--success);display:none}
    .best-choice.visible{display:block}
    .insights{background:var(--bg-elevated);border-radius:8px;padding:1rem;margin-top:1.5rem}
    .insights-title{font-size:.875rem;font-weight:600;color:var(--warning);margin-bottom:.75rem}
    .insights-list{list-style:none}
    .insights-list li{padding:.5rem 0;padding-left:1.5rem;position:relative;color:var(--text-secondary)}
    .insights-list li::before{content:"💡";position:absolute;left:0}
    .climax-section,.resolution-section,.bonus-section{background:var(--bg-card);border:1px solid var(--border);border-radius:16px;padding:2rem;margin-bottom:2rem}
    .section-title{font-size:1.5rem;font-weight:600;margin-bottom:1.5rem;display:flex;align-items:center;gap:.75rem}
    .outcome-badge{display:inline-block;padding:.5rem 1rem;border-radius:100px;font-weight:600;text-transform:uppercase;font-size:.875rem}
    .outcome-badge.hire{background:rgba(34,197,94,.2);color:var(--success)}
    .outcome-badge.no-hire{background:rgba(239,68,68,.2);color:var(--error)}
    .outcome-badge.strong-hire{background:rgba(34,197,94,.3);color:var(--success)}
    .takeaways-list{list-style:none;display:flex;flex-direction:column;gap:.75rem}
    .takeaways-list li{padding:1rem;background:var(--bg-elevated);border-radius:8px;display:flex;align-items:flex-start;gap:.75rem}
    .takeaway-number{width:24px;height:24px;background:var(--gradient);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.75rem;font-weight:700;flex-shrink:0}
    .practice-exercise{background:var(--bg-elevated);border-radius:8px;padding:1rem;margin-bottom:1rem}
    .exercise-title{font-weight:500;margin-bottom:.5rem}
    .exercise-criteria{font-size:.875rem;color:var(--text-muted)}
    @media(max-width:768px){.theater-container{padding:1rem}.episode-title{font-size:1.75rem}.scene{padding:1.5rem}.characters-section{grid-template-columns:1fr}}
  </style>
</head>
<body>
  <div class="theater-container">
    <header class="episode-header">
      <div class="episode-badge">🎭 Interview Theater</div>
      <h1 class="episode-title">${ep.title || 'Interview Theater Episode'}</h1>
      <p class="episode-synopsis">${ep.synopsis || ''}</p>
      <div class="episode-meta">
        <span class="meta-item">⏱️ ${ep.duration_estimate || '15-20 min'}</span>
        <span class="meta-item">📊 ${ep.difficulty || 'intermediate'}</span>
        <span class="meta-item">🏷️ ${(ep.tags || []).join(', ')}</span>
      </div>
    </header>
    
    <section class="characters-section">
      ${chars.candidate ? `<div class="character-card"><div class="character-header"><div class="character-avatar">${(chars.candidate.name || 'C')[0]}</div><div><div class="character-name">${chars.candidate.name || 'Candidate'}</div><div class="character-role">Candidate</div></div></div><p style="color:var(--text-secondary);font-size:.9rem">${chars.candidate.background || ''}</p><div class="character-traits">${(chars.candidate.strengths || []).map(s => `<span class="trait strength">✓ ${s}</span>`).join('')}${(chars.candidate.weaknesses || []).map(w => `<span class="trait weakness">△ ${w}</span>`).join('')}</div></div>` : ''}
      ${chars.interviewer ? `<div class="character-card"><div class="character-header"><div class="character-avatar" style="background:linear-gradient(135deg,#f59e0b 0%,#ef4444 100%)">${(chars.interviewer.name || 'I')[0]}</div><div><div class="character-name">${chars.interviewer.name || 'Interviewer'}</div><div class="character-role">${chars.interviewer.role || 'Interviewer'}</div></div></div><p style="color:var(--text-secondary);font-size:.9rem">${chars.interviewer.style || ''}</p></div>` : ''}
    </section>
    
    ${scenes.map(scene => `<section class="scene"><div class="scene-header"><div class="scene-number">${scene.scene_number || ''}</div><h2 class="scene-title">${scene.title || ''}</h2></div>${scene.setting ? `<div class="scene-setting">📍 ${scene.setting}</div>` : ''}<div class="dialogue">${(scene.dialogue || []).map(d => `<div class="dialogue-item ${d.speaker}"><div class="dialogue-speaker ${d.speaker}">${d.speaker === 'interviewer' ? (chars.interviewer?.name || 'Interviewer') : (chars.candidate?.name || 'Candidate')}</div><div class="dialogue-text">"${d.text || ''}"</div><div class="dialogue-meta">${d.thought_bubble ? `<span class="thought-bubble">💭 ${d.thought_bubble}</span>` : ''}${d.subtext ? `<span class="subtext">🎯 ${d.subtext}</span>` : ''}${d.coaching_note ? `<span class="coaching-note">📝 ${d.coaching_note}</span>` : ''}${d.technique_used ? `<span class="technique">⚡ ${d.technique_used}</span>` : ''}</div></div>`).join('')}</div>${scene.decision_point ? `<div class="decision-point" data-scene="${scene.scene_number}"><div class="decision-title">🤔 ${scene.decision_point.question || 'What should happen next?'}</div><div class="decision-options">${(scene.decision_point.options || []).map((opt, i) => `<div class="option" data-index="${i}" onclick="revealChoice(this,${scene.scene_number},${i === 1})"><div class="option-choice">${String.fromCharCode(65 + i)}. ${opt.choice || ''}</div><div class="option-outcome">${opt.outcome || ''}</div><div class="option-score">${opt.score_impact || ''}</div></div>`).join('')}</div><div class="best-choice" id="best-${scene.scene_number}">✅ ${scene.decision_point.best_choice || ''}</div></div>` : ''}${scene.key_insights && scene.key_insights.length > 0 ? `<div class="insights"><div class="insights-title">Key Insights</div><ul class="insights-list">${scene.key_insights.map(insight => `<li>${insight}</li>`).join('')}</ul></div>` : ''}</section>`).join('')}
    
    ${climax.title ? `<section class="climax-section"><h2 class="section-title">⚡ ${climax.title}</h2><p style="margin-bottom:1rem">${climax.description || ''}</p><p style="color:var(--text-secondary);margin-bottom:1.5rem"><strong>Candidate's Approach:</strong> ${climax.candidate_approach || ''}</p><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:1rem"><div style="background:rgba(34,197,94,.1);padding:1rem;border-radius:8px"><h4 style="color:var(--success);margin-bottom:.5rem">✓ What Went Well</h4><ul style="list-style:none;color:var(--text-secondary)">${(climax.what_went_well || []).map(item => `<li>• ${item}</li>`).join('')}</ul></div><div style="background:rgba(245,158,11,.1);padding:1rem;border-radius:8px"><h4 style="color:var(--warning);margin-bottom:.5rem">△ Could Improve</h4><ul style="list-style:none;color:var(--text-secondary)">${(climax.what_could_improve || []).map(item => `<li>• ${item}</li>`).join('')}</ul></div></div></section>` : ''}
    
    ${resolution.outcome ? `<section class="resolution-section"><h2 class="section-title">🎬 Resolution</h2><div style="text-align:center;margin-bottom:1.5rem"><span class="outcome-badge ${resolution.outcome}">${resolution.outcome.replace('-', ' ')}</span></div><p style="margin-bottom:1rem"><strong>Feedback:</strong> ${resolution.feedback_given || ''}</p><p style="color:var(--text-secondary);margin-bottom:1.5rem"><strong>Candidate Reflection:</strong> "${resolution.candidate_reflection || ''}"</p><h3 style="margin-bottom:1rem">🎯 Key Takeaways</h3><ul class="takeaways-list">${(resolution.viewer_takeaways || []).map((t, i) => `<li><span class="takeaway-number">${i + 1}</span><span>${t}</span></li>`).join('')}</ul></section>` : ''}
    
    ${bonus.practice_exercises && bonus.practice_exercises.length > 0 ? `<section class="bonus-section"><h2 class="section-title">🏋️ Practice Exercises</h2>${bonus.practice_exercises.map(ex => `<div class="practice-exercise"><div class="exercise-title">📝 ${ex.exercise || ''}</div><div class="exercise-criteria">Success criteria: ${ex.success_criteria || ''}</div></div>`).join('')}</section>` : ''}
  </div>
  <script>function revealChoice(el,sceneNum,isBest){const parent=el.closest('.decision-point');parent.querySelectorAll('.option').forEach(opt=>{opt.classList.add('revealed');if(opt===el&&isBest)opt.classList.add('best');else if(opt!==el)opt.classList.add('worse')});document.getElementById('best-'+sceneNum).classList.add('visible')}</script>
</body>
</html>`;
}

async function generateTheaterEpisode() {
  console.log('🎭 Interview Theater Generator');
  console.log('================================');
  console.log(`Topic: ${topic}`);
  console.log(`Candidate Level: ${candidateLevel}`);
  console.log(`Interview Style: ${interviewStyle}`);
  console.log('');

  try {
    console.log('🎬 Generating episode script...');
    
    // Use fallback for now (AI integration can be added later)
    const episode = JSON.parse(generateFallbackEpisode());
    
    // Generate HTML output
    const html = generateTheaterHTML(episode);
    
    // Save the episode
    const outputDir = path.join(__dirname, '..', 'blog-output', 'theater');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
    const timestamp = Date.now();
    const episodeDir = path.join(outputDir, `episode-${slug}-${timestamp}`);
    fs.mkdirSync(episodeDir, { recursive: true });
    
    // Save HTML
    fs.writeFileSync(path.join(episodeDir, 'index.html'), html);
    
    // Save JSON for interactive features
    fs.writeFileSync(path.join(episodeDir, 'episode-data.json'), JSON.stringify(episode, null, 2));
    
    console.log('');
    console.log('✅ Episode generated successfully!');
    console.log(`📁 Output: ${episodeDir}`);
    console.log('');
    console.log('🎬 Episode Details:');
    console.log(`   Title: ${episode.episode?.title || 'Interview Theater Episode'}`);
    console.log(`   Duration: ${episode.episode?.duration_estimate || '15-20 min'}`);
    console.log(`   Scenes: ${episode.scenes?.length || 0}`);
    
    return episode;
  } catch (error) {
    console.error('Error generating episode:', error.message);
    process.exit(1);
  }
}

// Run the generator
generateTheaterEpisode();
