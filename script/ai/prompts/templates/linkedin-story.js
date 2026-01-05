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
  
  return `Create a SHORT engaging LinkedIn post for a technical blog article.

Article Title: ${title}
Topic/Channel: ${channel || 'tech'}
Summary: ${excerpt || 'Technical interview preparation content'}

CRITICAL LENGTH REQUIREMENTS:
- Story MUST be 400-500 characters MAX (this is very important!)
- Use 3-4 SHORT sentences only
- Every sentence must be COMPLETE (no cut-off text)
- End with a clear call-to-action sentence

Content Requirements:
1. Start with ONE hook sentence - a surprising fact or relatable scenario
2. Add 1-2 sentences with key insight from the article
3. End with "Read the full breakdown below." or similar CTA
4. Use 1-2 emojis max
5. NO hashtags (added separately)
6. NO links (added separately)
7. Write as a tech professional sharing knowledge

Example format (follow this length):
"Picture this: [brief scenario in 1 sentence]. [Key insight in 1-2 sentences]. Read the full breakdown below."

Output JSON format:
{
  "story": "Your 400-500 character story here..."
}

Output ONLY valid JSON.`;
}

export default { schema, build };
