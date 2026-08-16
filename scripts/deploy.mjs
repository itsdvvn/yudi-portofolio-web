#!/usr/bin/env node

/**
 * Fast Deploy Script:
 * 1. Build Astro production bundle locally (super fast Apple Silicon).
 * 2. Rsync / SCP build bundle (dist) & config to VPS.
 * 3. Recreate docker container on VPS instantly with zero compilation on VPS CPU.
 * 
 * STRICT RULE: src/content on VPS is NEVER overwritten. Content stays 100% untouched on VPS.
 */

import { execSync } from 'child_process';

const TARGET_ENV = process.argv[2] === 'prod' ? 'prod' : 'dev';
const VPS_HOST = '43.156.121.141';
const VPS_USER = 'root';
const VPS_PASS = 'REDACTED_PASSWORD';

const REMOTE_DIR = TARGET_ENV === 'prod' ? '/root/portfolio' : '/root/portfolio-dev';
const CONTAINER_NAME = TARGET_ENV === 'prod' ? 'yudi-portfolio-web' : 'yudi-portfolio-dev';

console.log(`\n🚀 [Fast Deploy] Memulai deployment ke ${TARGET_ENV.toUpperCase()} (${REMOTE_DIR})...`);

// 1. Build Lokal
console.log('📦 1. Building Astro bundle di Mac Lokal...');
execSync('npm run build', { stdio: 'inherit' });

// 2. Sync File Bundle ke VPS (HANYA dist, keystatic.config.ts, Dockerfile.runner, package.json)
console.log('📡 2. Mengunggah bundle terkompilasi ke VPS...');
const sshpass = `sshpass -p '${VPS_PASS}'`;

// Pastikan remote folder siap
execSync(`${sshpass} ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "mkdir -p ${REMOTE_DIR}/dist"`, { stdio: 'inherit' });

// Sync dist
execSync(`${sshpass} rsync -avz --delete dist/ ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/dist/`, { stdio: 'inherit' });

// Sync configs
execSync(`${sshpass} scp -o StrictHostKeyChecking=no keystatic.config.ts Dockerfile.runner package.json ${VPS_USER}@${VPS_HOST}:${REMOTE_DIR}/`, { stdio: 'inherit' });

// 3. Rebuild Runner Container Instan di VPS (Tanpa Kompilasi, ~3 detik)
console.log('⚡ 3. Me-restart container di VPS dengan build instan...');
const remoteCommands = `
cd ${REMOTE_DIR}
docker build -f Dockerfile.runner -t ${TARGET_ENV === 'prod' ? 'portfolio-portfolio' : 'portfolio-dev-portfolio-dev'} .
docker compose up -d --force-recreate
`;

execSync(`${sshpass} ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_HOST} "${remoteCommands}"`, { stdio: 'inherit' });

console.log(`\n🎉 [Fast Deploy] Deployment ke ${TARGET_ENV.toUpperCase()} SELESAI dalam hitungan detik dengan 0% CPU Spike!\n`);
