export const prerender = false;

import type { APIRoute } from 'astro';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import mime from 'mime-types';
import dotenv from 'dotenv';

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID || '54654e7eebbed345259d292ae43dafe6';
const bucketName = process.env.R2_BUCKET_NAME || 'yudi-web-personal';
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const publicDomain = process.env.R2_PUBLIC_DOMAIN || 'https://media.itsdvvn.my.id';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const folder = (formData.get('folder') as string) || 'avatar';

    if (!file || typeof file === 'string') {
      return new Response(JSON.stringify({ error: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!accessKeyId || !secretAccessKey) {
      return new Response(
        JSON.stringify({ error: 'R2_ACCESS_KEY_ID or R2_SECRET_ACCESS_KEY is not configured in .env' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${Date.now()}-${cleanFileName}`;
    const contentType = file.type || mime.lookup(file.name) || 'application/octet-stream';

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
      })
    );

    const publicUrl = `${publicDomain.replace(/\/$/, '')}/${key}`;

    return new Response(
      JSON.stringify({
        success: true,
        url: publicUrl,
        key,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('R2 Upload Error:', err);
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to upload to Cloudflare R2' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
