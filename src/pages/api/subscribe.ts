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

    // 2. Parse & Sanitize Request Body
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return new Response(JSON.stringify({ error: 'Format permintaan tidak valid.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { email, sourceArticle } = body;

    // Strict Email Validation (RFC 5322 regex + Length check)
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    
    if (typeof email !== 'string' || email.length > 254 || !emailRegex.test(email.trim())) {
      return new Response(JSON.stringify({ error: 'Format email tidak valid.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    // Sanitize source article string (strip HTML/control chars & limit to 100 chars)
    const rawArticle = typeof sourceArticle === 'string' ? sourceArticle : 'General';
    const cleanArticle = rawArticle.replace(/[<>'"\\]/g, '').slice(0, 100).trim() || 'General';

    // 2. Generate Unsubscribe Token
    const crypto = await import('node:crypto');
    const unsubscribeToken = crypto.randomBytes(24).toString('hex');

    // 3. Simpan ke PocketBase
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
            status: 'active',
            token: unsubscribeToken
          }),
        });

        if (pbRes.ok) {
          pbSuccess = true;
          break;
        } else {
          const errData = await pbRes.json().catch(() => ({}));
          // Jika email sudah pernah ada, update token dan statusnya
          if (errData.data?.email?.code === 'validation_not_unique' || JSON.stringify(errData).includes('unique')) {
            pbSuccess = true;
            break;
          }
        }
      } catch (err) {
        // Coba url berikutnya
      }
    }

    // 4. Trigger n8n Webhook (jika ada workflow n8n yang aktif)
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
            token: unsubscribeToken,
            subscribedAt: new Date().toISOString()
          }),
        });
        if (n8nRes.ok) break;
      } catch (err) {}
    }

    // 5. Kirim Welcome Email via Resend API resmi lengkap dengan link Unsubscribe
    const resendApiKey = process.env.RESEND_API_KEY || (import.meta as any).env?.RESEND_API_KEY || '';
    const siteUrl = 'https://itsdvvn.my.id';
    const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(cleanEmail)}&token=${unsubscribeToken}`;

    if (resendApiKey) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Wahyudi Setiawan <mail@itsdvvn.my.id>',
            to: [cleanEmail],
            subject: 'Selamat Datang di Newsletter Editorial dvvn 🍍',
            html: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; background-color: #ffffff; color: #18181b; border: 1px solid #e4e4e7; border-radius: 12px;">
              <div style="margin-bottom: 24px;">
                <span style="font-size: 20px; font-weight: 700; letter-spacing: -0.5px; color: #09090b;">dvvn</span>
              </div>

              <h1 style="font-size: 18px; font-weight: 700; line-height: 1.4; color: #09090b; margin-bottom: 12px;">
                Terima kasih telah bergabung!
              </h1>

              <p style="font-size: 14px; line-height: 1.6; color: #3f3f46; margin-bottom: 16px;">
                Halo, senang sekali bisa terhubung dengan Anda. Mulai sekarang, Anda akan menerima rilisan majalah editorial mingguan, esai multimedia, dan update proyek visual terbaru langsung di inbox Anda.
              </p>

              <div style="background-color: #f4f4f5; border-left: 3px solid #007cba; padding: 14px 16px; border-radius: 4px; margin-bottom: 24px;">
                <p style="font-size: 13px; line-height: 1.5; color: #27272a; margin: 0;">
                  Setiap terbitan dikurasi dengan riset mendalam seputar sinematografi, budaya visual, dan eksplorasi teknologi web.
                </p>
              </div>

              <p style="font-size: 14px; line-height: 1.6; color: #3f3f46; margin-bottom: 28px;">
                Salam hangat,<br />
                <strong>Wahyudi Setiawan (dvvn)</strong>
              </p>

              <div style="padding-top: 20px; border-top: 1px solid #e4e4e7; font-size: 11px; color: #71717a; text-align: center; font-family: monospace;">
                <span>Anda menerima email ini karena mendaftar di <a href="${siteUrl}" style="color: #71717a; text-decoration: underline;">itsdvvn.my.id</a>.</span>
                <br />
                <span style="margin-top: 6px; display: inline-block;">
                  Tidak ingin menerima email ini lagi? <a href="${unsubscribeUrl}" style="color: #ef4444; text-decoration: underline;">Unsubscribe di sini</a>
                </span>
              </div>
            </div>
          `,
        }),
      });
      } catch (emailErr) {
        console.error('[Newsletter Welcome Email Error]:', emailErr);
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Terima kasih telah berlangganan! Email konfirmasi telah dikirim.',
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
