import { defineCollection, z } from 'astro:content';

const editionsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    editionNumber: z.string().optional().nullable(),
    publishDate: z.coerce.date(),
    coverImage: z.string().optional().nullable(),
    coverImageUrl: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    featured: z.boolean().default(true),
    draft: z.boolean().default(false),
  }),
});

const writingsCollection = defineCollection({
  type: 'content',
  schema: () =>
    z.object({
      title: z.string().max(80),
      publicationType: z.union([
        z.enum(['reguler', 'mingguan']),
        z.object({
          discriminant: z.enum(['reguler', 'mingguan']),
          value: z.record(z.any()).optional().nullable(),
        }),
      ]).default('reguler'),
      edition: z.string().optional().nullable(),
      rubrik: z.string().optional().nullable(),
      order: z.number().optional().nullable(),
      isCoverStory: z.boolean().optional().nullable(),
      category: z.string().default('Article'),
      deck: z.string().max(144).optional().nullable(),
      publishDate: z.coerce.date(),
      publishTime: z.string().optional().nullable(),
      updatedDate: z.coerce.date().optional().nullable(),
      updatedTime: z.string().optional().nullable(),
      readTime: z.string().optional().nullable(),
      heroImage: z.string().optional().nullable(),
      heroImageUrl: z.string().optional().nullable(),
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
    category: z.string().default('Photography'),
    customCategory: z.string().optional().nullable(),
    description: z.string(),
    client: z.string().optional().nullable(),
    role: z.string().optional().nullable(),
    coverImage: z.string().optional().nullable(),
    coverImageUrl: z.string().optional().nullable(),
    videoUrl: z.string().optional().nullable(),
    link: z.string().optional().nullable(),
    github: z.string().optional().nullable(),
    tools: z.array(z.string()).default([]),
    year: z.string().default('2025'),
    featured: z.boolean().default(false),
    publishDate: z.coerce.date().optional().nullable(),
    updatedDate: z.coerce.date().optional().nullable(),
    updatedTime: z.string().optional().nullable(),
  }),
});

export const collections = {
  writings: writingsCollection,
  editions: editionsCollection,
  thoughts: thoughtsCollection,
  ships: shipsCollection,
};
