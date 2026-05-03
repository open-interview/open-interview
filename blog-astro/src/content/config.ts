import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    category: z.string(),
    tags: z.array(z.string()).default([]),
    publishedAt: z.coerce.date(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    readingTimeMinutes: z.number().default(5),
    featured: z.boolean().default(false),
    author: z.string().default('TechExpert AI'),
    coverImage: z.string().optional(),
  }),
});

export const collections = { blog };
