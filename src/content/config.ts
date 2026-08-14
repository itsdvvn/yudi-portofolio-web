import { defineCollection, z } from 'astro:content';

const writingsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.coerce.date(),
    readTime: z.string().default('3 min read'),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
  }),
});

const thoughtsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    id: z.string().optional(),
    publishDate: z.coerce.date(),
    tags: z.array(z.string()).default([]),
  }),
});

const shipsCollection = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    status: z.enum(['live', 'building', 'archived']).default('live'),
    year: z.string().default('2025'),
    link: z.string().optional().nullable(),
    github: z.string().optional().nullable(),
    techStack: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  writings: writingsCollection,
  thoughts: thoughtsCollection,
  ships: shipsCollection,
};
