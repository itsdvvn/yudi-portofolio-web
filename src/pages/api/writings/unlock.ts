export const prerender = false;

import type { APIRoute } from 'astro';
import { reader } from '../../../lib/reader';
import { calculateReadingTime } from '../../../lib/readingTime';
import { renderWritingHtml } from '../../../lib/markdocWriting';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json().catch(() => null);
    if (!body || !body.slug) {
      return new Response(JSON.stringify({ error: 'Parameter slug diperlukan' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { slug, password = '' } = body;
    const post = await reader.collections.writings.read(slug);

    if (!post) {
      return new Response(JSON.stringify({ error: 'Artikel tidak ditemukan' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Jika artikel tidak dikunci, langsung kirim kontennya
    if (!post.isLocked) {
      const contentAst = await post.content();
      const { htmlContent, citations } = renderWritingHtml(contentAst, slug);
      const readTime = calculateReadingTime(htmlContent);

      return new Response(
        JSON.stringify({
          success: true,
          htmlContent,
          citations,
          readTime,
          isLocked: false,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Verifikasi password (case-insensitive & trim whitespace)
    const cleanInput = String(password || '').trim().toLowerCase();
    const cleanActual = String(post.password || '').trim().toLowerCase();

    if (cleanActual && cleanInput !== cleanActual) {
      return new Response(
        JSON.stringify({
          error: 'Kata sandi keliru. Silakan periksa petunjuk (clue) dan coba lagi.',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Password valid! Render Markdoc ke HTML di server
    const contentAst = await post.content();
    const { htmlContent, citations } = renderWritingHtml(contentAst, slug);
    const readTime = calculateReadingTime(htmlContent);

    return new Response(
      JSON.stringify({
        success: true,
        htmlContent,
        citations,
        readTime,
        isLocked: true,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('[API /api/writings/unlock] Error:', err);
    return new Response(
      JSON.stringify({ error: 'Terjadi kesalahan pada server saat membuka artikel.' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
