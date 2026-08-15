export const prerender = false;

import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import mime from 'mime-types';

export const GET: APIRoute = async ({ params }) => {
  const fileParam = params.file;
  if (!fileParam) {
    return new Response('Not found', { status: 404 });
  }

  // Look in multiple candidate directories
  const candidates = [
    path.resolve(process.cwd(), 'public/images', fileParam),
    path.resolve(process.cwd(), 'public/images/body', fileParam),
    path.resolve(process.cwd(), 'public/images/writings', fileParam),
    path.resolve(process.cwd(), 'src/assets', fileParam),
    path.resolve(process.cwd(), 'src/content/writings', fileParam),
    path.resolve(process.cwd(), 'src/content', fileParam),
    path.resolve('/app/public/images', fileParam),
    path.resolve('/app/public/images/body', fileParam),
    path.resolve('/app/public/images/writings', fileParam),
  ];

  let filePath = candidates.find((p) => fs.existsSync(p) && fs.statSync(p).isFile());

  if (!filePath) {
    return new Response('Media not found', { status: 404 });
  }

  try {
    const fileBuffer = fs.readFileSync(filePath);
    const contentType = mime.lookup(filePath) || 'image/jpeg';

    return new Response(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (e) {
    return new Response('Error reading media', { status: 500 });
  }
};
