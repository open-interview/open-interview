import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const categoryToChannel: Record<string, string> = {
  cloud: 'aws',
  devops: 'devops',
  'ai/ml': 'machine-learning',
  engineering: 'system-design',
  frontend: 'frontend',
  backend: 'backend',
  security: 'security',
  database: 'database',
  kubernetes: 'kubernetes',
  docker: 'docker',
};

const imageSchema = z.object({
  url: z.string(),
  alt: z.string().optional().default(''),
  caption: z.string().optional().default(''),
  placement: z.string().optional().default(''),
});

const sourceSchema = z.object({
  title: z.string(),
  url: z.string(),
  type: z.string().optional().default('article'),
});

const blog = defineCollection({
  loader: glob({ pattern: '**/*.mdx', base: '../content/posts' }),
  schema: z.object({
    id: z.string().optional(),
    title: z.string(),
    slug: z.string(),
    channel: z.string().optional(),
    category: z.string().optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
    tags: z.array(z.string()).optional().default([]),
    createdAt: z.coerce.date().optional(),
    publishedAt: z.coerce.date().optional(),
    funFact: z.string().optional(),
    diagram: z.string().optional(),
    images: z.array(imageSchema).optional().default([]),
    sources: z.array(sourceSchema).optional().default([]),
    author: z.string().optional(),
    coverImage: z.string().optional(),
    excerpt: z.string().optional(),
    featured: z.boolean().optional().default(false),
    readingTimeMinutes: z.number().optional(),
  }).transform(data => {
    const id = data.id ?? data.slug;
    const channel = data.channel
      ?? (data.category ? categoryToChannel[data.category.toLowerCase()] ?? data.category.toLowerCase() : undefined)
      ?? (data.tags?.[0] ?? 'general');
    return { ...data, id, channel };
  }),
});

export const collections = { blog };
