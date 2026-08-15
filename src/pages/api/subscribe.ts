export const prerender = false;

import type { APIRoute } from 'astro';

// Rate limit map for subscribe endpoint (IP -> { count, resetTime })
const subscribeLimits = new Map<string, { count: number; resetTime: number }>();
const MAX_SUBSCRIBES = 5; // Max 5 subscribe requests per 10 minutes per IP
const SUB_WINDOW_MS = 10 * 60 * 1000;

setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of subscribeLimits.entries()) {
    if (now > entry.resetTime) {
      subscribeLimits.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export const POST: APIRoute = async ({ request, clientAddress }) => {
  try {
    const ip = clientAddress || request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();

    // 1. Rate Limiting to prevent spam/abuse
    let entry = subscribeLimits.get(ip);
    if (entry) {
      if (now < entry.resetTime) {
        if (entry.count >= MAX_SUBSCRIBES) {
          return new Response(JSON.stringify({ error: 'Terlalu banyak permintaan langganan. Silakan tunggu beberapa saat.' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        entry.count += 1;
      } else {
        entry = { count: 1, resetTime: now + SUB_WINDOW_MS };
      }
    } else {
      entry = { count: 1, resetTime: now + SUB_WINDOW_MS };
    }
    subscribeLimits.set(ip, entry);

    const { email, sourceArticle } = await request.json();

    if (!email || !email.includes('@') || !email.includes('.')) {
      return new Response(JSON.stringify({ error: 'Format email tidak valid.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanArticle = (sourceArticle || 'General').trim();

    // 2. Simpan ke PocketBase
    let pbSuccess = false;
    const pbUrls = [
      'http://pocketbase-media:8090/api/collections/subscribers/records',
      'http://127.0.0.1:8090/api/collections/subscribers/records',
      'https://pb.itsdvvn.my.id/api/collections/subscribers/records'
    ];

    for (const url of pbUrls) {
      try {
        const pbRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            source_article: cleanArticle,
            status: 'active'
          }),
        });

        if (pbRes.ok) {
          pbSuccess = true;
          break;
        } else {
          const errData = await pbRes.json();
          if (errData.data?.email?.code === 'validation_not_unique' || JSON.stringify(errData).includes('unique')) {
            pbSuccess = true;
            break;
          }
        }
      } catch (err) {
        // Coba url berikutnya
      }
    }

    // 3. Trigger n8n Webhook
    const n8nUrls = [
      'http://n8n:5678/webhook/newsletter-subscribe',
      'http://127.0.0.1:5678/webhook/newsletter-subscribe',
      'https://n8n.terato.my.id/webhook/newsletter-subscribe'
    ];

    for (const url of n8nUrls) {
      try {
        const n8nRes = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: cleanEmail,
            sourceArticle: cleanArticle,
            subscribedAt: new Date().toISOString()
          }),
        });
        if (n8nRes.ok) {
          break;
        }
      } catch (err) {
        // Coba url berikutnya
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Terima kasih telah berlangganan!',
      email: cleanEmail
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Gagal memproses langganan' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
