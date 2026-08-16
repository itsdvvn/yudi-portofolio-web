export const prerender = false;

import type { APIRoute } from 'astro';

export const ALL: APIRoute = async ({ site }) => {
  const baseUrl = (site ? site.origin : 'https://itsdvvn.my.id').replace(/\/+$/, '');

  const robots = `User-agent: *
Allow: /

# Protect Private & Admin Dashboards from Search Indexing
Disallow: /admin/
Disallow: /keystatic/
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`;

  return new Response(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400',
    },
  });
};
