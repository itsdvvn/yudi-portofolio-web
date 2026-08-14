export const prerender = false;

import type { APIRoute } from 'astro';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID || '54654e7eebbed345259d292ae43dafe6';
const bucketName = process.env.R2_BUCKET_NAME || 'yudi-web-personal';
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const publicDomain = process.env.R2_PUBLIC_DOMAIN || 'https://media.itsdvvn.my.id';

export const GET: APIRoute = async () => {
  if (!accessKeyId || !secretAccessKey) {
    return new Response(
      JSON.stringify({ error: 'R2 credentials not set in .env' }),
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

  try {
    const data = await s3.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: 50,
      })
    );

    const items = (data.Contents || []).map((obj) => ({
      key: obj.Key,
      size: obj.Size,
      lastModified: obj.LastModified,
      url: `${publicDomain.replace(/\/$/, '')}/${obj.Key}`,
    }));

    return new Response(
      JSON.stringify({
        success: true,
        count: items.length,
        items,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || 'Failed to list objects from Cloudflare R2' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
