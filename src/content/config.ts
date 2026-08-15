import { defineCollection, z } from 'astro:content';

const editionsCollection = defineCollection({
  type: 'data',
  schema: z.object({
    title: z.string(),
    editionNumber: z.string().default('Edisi Terbaru'),
    publishDate: z.coerce.date(),
    publishTime: z.string().default('16.00 WIB'),
    coverImage: z.string().optional().nullable(),
    coverImageUrl: z.string().optional().nullable(),
    summary: z.string().optional().nullable(),
    featured: z.boolean().default(true),
  }),
});

const writingsCollection = defineCollection({
  type: 'content',
  schema: () =>
    z.object({
      title: z.string().max(80),
      publicationType: z.enum(['reguler', 'mingguan']).default('reguler'),
      edition: z.string().optional().nullable(),
      rubrik: z.string().default('Artikel'),
      order: z.number().default(1),
      isCoverStory: z.boolean().default(false),
      category: z.string().default('Article'),
      deck: z.string().max(144).optional().nullable(),
      publishDate: z.coerce.date(),
      publishTime: z.string().default('10:00 AM'),
      readTime: z.string().default('3 min read'),
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
    category: z.enum(['Photography', 'Videography', 'Design', 'Code', 'Multimedia']).default('Photography'),
    description: z.string(),
    coverImage: z.string().optional().nullable(),
    coverImageUrl: z.string().optional().nullable(),
    videoUrl: z.string().optional().nullable(),
    link: z.string().optional().nullable(),
    github: z.string().optional().nullable(),
    tools: z.array(z.string()).default([]),
    year: z.string().default('2025'),
    featured: z.boolean().default(false),
  }),
});

export const collections = {
  writings: writingsCollection,
  editions: editionsCollection,
  thoughts: thoughtsCollection,
  ships: shipsCollection,
};
