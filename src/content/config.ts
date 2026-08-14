import { defineCollection, z } from 'astro:content';

const writingsCollection = defineCollection({
  type: 'content',
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      category: z.string().default('Article'),
      deck: z.string().optional().nullable(),
      publishDate: z.coerce.date(),
      publishTime: z.string().default('10:00 AM'),
      readTime: z.string().default('3 min read'),
      heroImage: z.string().optional().nullable(),
      imageCaption: z.string().optional().nullable(),
      photoCredit: z.string().optional().nullable(),
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
