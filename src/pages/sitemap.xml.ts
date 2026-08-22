export const prerender = false;

import type { APIRoute } from 'astro';
import { reader } from '../lib/reader';
import { isArticlePublished, parsePublishDateTime } from '../lib/schedule';

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export const GET: APIRoute = async ({ site }) => {
  const baseUrl = (site ? site.origin : 'https://itsdvvn.my.id').replace(/\/+$/, '');

  // 1. Static Pages
  const staticPages = [
    { url: `${baseUrl}/`, changefreq: 'daily', priority: '1.0' },
    { url: `${baseUrl}/writings`, changefreq: 'daily', priority: '0.9' },
    { url: `${baseUrl}/ships`, changefreq: 'weekly', priority: '0.8' },
    { url: `${baseUrl}/thoughts`, changefreq: 'daily', priority: '0.8' },
    { url: `${baseUrl}/privacy`, changefreq: 'monthly', priority: '0.5' },
  ];

  // 1b. Check About Page
  try {
    const aboutData = (await (reader.singletons as any).about?.read()) || {};
    if (aboutData.showInNavbar) {
      staticPages.push({ url: `${baseUrl}/about`, changefreq: 'monthly', priority: '0.8' });
    }
  } catch (e) {}

  // 2. Dynamic Writings Articles
  const writingSlugs = await reader.collections.writings.list();
  const writings = await Promise.all(
    writingSlugs.map(async (slug) => {
      try {
        const data = await reader.collections.writings.read(slug);
        if (!data) return null;
        return { slug, ...data };
      } catch (e) {
        return null;
      }
    })
  );

  const dynamicWritingPages = writings
    .filter((post) => post && isArticlePublished(post))
    .map((post) => {
      const lastmodDate = post!.updatedDate || post!.publishDate;
      let formattedLastmod = new Date().toISOString().split('T')[0];
      if (lastmodDate) {
        try {
          formattedLastmod = parsePublishDateTime(lastmodDate).toISOString().split('T')[0];
        } catch {
          formattedLastmod = String(lastmodDate).substring(0, 10);
        }
      }
      return {
        url: `${baseUrl}/writings/${post!.slug}`,
        lastmod: formattedLastmod,
        changefreq: 'monthly',
        priority: '0.8',
      };
    });

  // 3. Dynamic Ships Case Studies
  let dynamicShipPages: any[] = [];
  try {
    const shipSlugs = await reader.collections.ships.list();
    const ships = await Promise.all(
      shipSlugs.map(async (slug) => {
        try {
          const data = await reader.collections.ships.read(slug);
          return data ? { slug, ...data } : null;
        } catch {
          return null;
        }
      })
    );
    dynamicShipPages = ships
      .filter(Boolean)
      .map((ship) => ({
        url: `${baseUrl}/ships/${ship!.slug}`,
        lastmod: new Date().toISOString().split('T')[0],
        changefreq: 'monthly',
        priority: '0.7',
      }));
  } catch (e) {}

  // 4. Dynamic Authors Pages
  let dynamicAuthorPages: any[] = [];
  try {
    const authorSlugs = (await (reader.collections as any).authors?.list()) || [];
    dynamicAuthorPages = authorSlugs.map((slug: string) => ({
      url: `${baseUrl}/writings/author/${slug}`,
      lastmod: new Date().toISOString().split('T')[0],
      changefreq: 'weekly',
      priority: '0.6',
    }));
  } catch (e) {}

  const allPages = [...staticPages, ...dynamicWritingPages, ...dynamicShipPages, ...dynamicAuthorPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${escapeXml(page.url)}</loc>
    <lastmod>${page.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  });
};

export const ALL = GET;
