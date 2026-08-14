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

  // Look in both public/images and current working directory
  const filePath = path.resolve(process.cwd(), 'public/images', fileParam);

  if (!fs.existsSync(filePath)) {
    return new Response('Image not found', { status: 404 });
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
    return new Response('Error reading image', { status: 500 });
  }
};
