/**
 * LinkedIn Story Generation Template
 * Creates engaging story-style posts for LinkedIn
 */

export const schema = {
  type: 'object',
  required: ['story'],
  properties: {
    story: {
      type: 'string',
      minLength: 100,
      maxLength: 1500,
      description: 'The engaging story text for LinkedIn'
    }
  }
};

export function build(context) {
  const { title, excerpt, channel, tags } = context;
  
  return `Create an engaging LinkedIn post for a technical blog article. Make it story-like and compelling.

Article Title: ${title}
Topic/Channel: ${channel || 'tech'}
Summary: ${excerpt || 'Technical interview preparation content'}
Suggested Tags: ${tags || '#tech #engineering'}

Requirements:
1. Start with a hook - a relatable scenario, surprising fact, or thought-provoking question
2. Keep it conversational and authentic (not salesy)
3. Include 2-3 key insights or takeaways from the article
4. End with a call-to-action to read the full article
5. Use appropriate emojis sparingly (2-4 max in the story part)
6. Keep total length under 1000 characters
7. DO NOT include any hashtags - they will be added separately
8. DO NOT include any links - they will be added separately
9. Write in first person as a tech professional sharing knowledge
10. Make it feel like a genuine insight, not marketing

Output JSON format:
{
  "story": "Your engaging story text here..."
}

Output ONLY valid JSON, nothing else.`;
}

export default { schema, build };
