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

  // 1. Strict Path Traversal Protection
  // Prevent attempts to access parent directories via ../ or encoded %2e%2e
  if (fileParam.includes('..') || fileParam.includes('\0') || fileParam.startsWith('/') || fileParam.startsWith('\\')) {
    return new Response('Access denied', { status: 403 });
  }

  // 2. Enforce Safe Image File Extensions
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.svg', '.gif', '.avif'];
  const ext = path.extname(fileParam).toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    return new Response('Unsupported media format', { status: 400 });
  }

  // Look in multiple candidate directories
  const candidates = [
    path.resolve(process.cwd(), 'public/images', fileParam),
    path.resolve(process.cwd(), 'public/images/body', fileParam),
    path.resolve(process.cwd(), 'public/images/writings', fileParam),
    path.resolve('/app/public/images', fileParam),
    path.resolve('/app/public/images/body', fileParam),
    path.resolve('/app/public/images/writings', fileParam),
  ];

  let filePath = candidates.find((p) => {
    try {
      return fs.existsSync(p) && fs.statSync(p).isFile();
    } catch {
      return false;
    }
  });

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
