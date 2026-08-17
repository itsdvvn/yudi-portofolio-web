export const prerender = false;

import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const email = url.searchParams.get('email')?.trim().toLowerCase();
  const token = url.searchParams.get('token')?.trim();

  let success = false;
  let errorMsg = '';

  if (!email) {
    errorMsg = 'Parameter email tidak ditemukan.';
  } else {
    // Cari & Update record di PocketBase
    const pbUrls = [
      'http://pocketbase-media:8090/api/collections/subscribers/records',
      'http://127.0.0.1:8090/api/collections/subscribers/records',
      'https://pb.itsdvvn.my.id/api/collections/subscribers/records'
    ];

    for (const pbBase of pbUrls) {
      try {
        // Cari id berdasarkan email
        const searchRes = await fetch(`${pbBase}?filter=(email='${encodeURIComponent(email)}')`);
        if (searchRes.ok) {
          const data = await searchRes.json();
          if (data.items && data.items.length > 0) {
            for (const subscriber of data.items) {
              await fetch(`${pbBase}/${subscriber.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'unsubscribed' })
              });
            }
            success = true;
            break;
          }
        }
      } catch (e) {
        // Coba url berikutnya
      }
    }
  }

  const html = `
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Unsubscribe Newsletter – dvvn</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #09090b;
          color: #f4f4f5;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          margin: 0;
          padding: 16px;
        }
        .card {
          background: #18181b;
          border: 1px solid #27272a;
          border-radius: 12px;
          padding: 32px 24px;
          max-width: 440px;
          width: 100%;
          text-align: center;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
        }
        h1 {
          font-size: 1.25rem;
          font-weight: 700;
          margin-bottom: 8px;
          color: #ffffff;
        }
        p {
          font-size: 0.875rem;
          color: #a1a1aa;
          line-height: 1.6;
          margin-bottom: 24px;
        }
        .badge {
          display: inline-block;
          font-family: monospace;
          font-size: 0.75rem;
          padding: 4px 8px;
          border-radius: 4px;
          background: #27272a;
          color: #e4e4e7;
          margin-bottom: 16px;
        }
        .btn {
          display: inline-block;
          font-size: 0.8125rem;
          font-weight: 600;
          color: #09090b;
          background: #ffffff;
          padding: 8px 20px;
          border-radius: 6px;
          text-decoration: none;
          transition: background 0.15s;
        }
        .btn:hover {
          background: #e4e4e7;
        }
      </style>
    </head>
    <body>
      <div class="card">
        ${success ? `
          <div style="font-size: 2.5rem; margin-bottom: 12px;">👋</div>
          <h1>Berhasil Berhenti Berlangganan</h1>
          <div class="badge">${email}</div>
          <p>Email Anda telah diperbarui menjadi 'unsubscribed' di daftar distribusi newsletter mingguan dvvn. Anda tidak akan menerima blast email mingguan lagi di masa mendatang.</p>
        ` : `
          <div style="font-size: 2.5rem; margin-bottom: 12px;">⚠️</div>
          <h1>Gagal Memproses Permintaan</h1>
          <p>${errorMsg || 'Tautan unsubscribe tidak valid atau email tidak terdaftar.'}</p>
        `}
        <a href="/" class="btn">Kembali ke Beranda</a>
      </div>
    </body>
    </html>
  `;

  return new Response(html, {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' }
  });
};
