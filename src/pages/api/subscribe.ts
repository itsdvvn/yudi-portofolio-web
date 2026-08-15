export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, sourceArticle } = await request.json();

    if (!email || !email.includes('@') || !email.includes('.')) {
      return new Response(JSON.stringify({ error: 'Format email tidak valid.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanArticle = (sourceArticle || 'General').trim();

    // 1. Simpan ke PocketBase
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
          // Jika email sudah terdaftar di PocketBase
          if (errData.data?.email?.code === 'validation_not_unique' || JSON.stringify(errData).includes('unique')) {
            pbSuccess = true; // Email sudah terdaftar sebelumnya, tetap lanjutkan
            break;
          }
        }
      } catch (err) {
        // Coba url berikutnya
      }
    }

    // 2. Trigger n8n Webhook
    const n8nUrls = [
      'http://n8n:5678/webhook/newsletter-subscribe',
      'http://127.0.0.1:5678/webhook/newsletter-subscribe',
      'https://n8n.terato.my.id/webhook/newsletter-subscribe'
    ];

    let n8nSuccess = false;
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
          n8nSuccess = true;
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
