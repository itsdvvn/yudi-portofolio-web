import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import mime from 'mime-types';
import dotenv from 'dotenv';

dotenv.config();

const accountId = process.env.R2_ACCOUNT_ID || '54654e7eebbed345259d292ae43dafe6';
const bucketName = process.env.R2_BUCKET_NAME || 'yudi-web-personal';
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const publicDomain = process.env.R2_PUBLIC_DOMAIN || 'https://media.itsdvvn.my.id';

const filePath = process.argv[2];
const customKey = process.argv[3];

if (!filePath) {
  console.log(`
\x1b[36mCloudflare R2 Media Uploader\x1b[0m
====================================
Cara Pakai:
  node scripts/upload-media.mjs <path-ke-file> [folder/nama-file-tujuan]

Contoh:
  node scripts/upload-media.mjs ./photos/street.jpg photos/street.jpg
  node scripts/upload-media.mjs ./video.mp4 videos/project-teaser.mp4

Bucket : ${bucketName}
Domain : ${publicDomain}
`);
  process.exit(0);
}

if (!accessKeyId || !secretAccessKey) {
  console.error(`
\x1b[31m[ERROR] R2 API Token belum diset di file .env!\x1b[0m
Silakan isi R2_ACCESS_KEY_ID dan R2_SECRET_ACCESS_KEY di file \x1b[33m.env\x1b[0m.

(Dapat dibuat di Dashboard Cloudflare: R2 > Manage R2 API Tokens > Create API Token)
`);
  process.exit(1);
}

const resolvedPath = path.resolve(filePath);

if (!fs.existsSync(resolvedPath)) {
  console.error(`\x1b[31m[ERROR] File tidak ditemukan:\x1b[0m ${resolvedPath}`);
  process.exit(1);
}

const fileStream = fs.createReadStream(resolvedPath);
const fileName = path.basename(resolvedPath);
const key = customKey || `media/${Date.now()}-${fileName}`;
const mimeType = mime.lookup(resolvedPath) || 'application/octet-stream';

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});

async function upload() {
  console.log(`\n\x1b[34m[UPLOADING]\x1b[0m Mengunggah \x1b[33m${fileName}\x1b[0m ke bucket \x1b[36m${bucketName}\x1b[0m...`);
  
  const uploadParams = {
    Bucket: bucketName,
    Key: key,
    Body: fs.readFileSync(resolvedPath),
    ContentType: mimeType,
  };

  try {
    await s3.send(new PutObjectCommand(uploadParams));
    const publicUrl = `${publicDomain.replace(/\/$/, '')}/${key}`;
    
    console.log(`\n\x1b[32m[SUCCESS] Berhasil diunggah ke Cloudflare R2!\x1b[0m`);
    console.log(`--------------------------------------------------`);
    console.log(`Key / Path   : \x1b[36m${key}\x1b[0m`);
    console.log(`Content-Type : ${mimeType}`);
    console.log(`Public URL   : \x1b[32m\x1b[1m${publicUrl}\x1b[0m`);
    console.log(`--------------------------------------------------`);
    console.log(`💡 Salin URL di atas dan tempelkan langsung ke Keystatic CMS!`);
  } catch (error) {
    console.error(`\n\x1b[31m[UPLOAD FAILED]\x1b[0m`, error);
  }
}

upload();
