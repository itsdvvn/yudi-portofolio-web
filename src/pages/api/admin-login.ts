export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email dan password wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Authenticate with PocketBase Superuser endpoint
    const pbUrl = 'http://pocketbase-media:8090/api/collections/_superusers/auth-with-password';
    let authRes: globalThis.Response;

    try {
      authRes = await fetch(pbUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password }),
      });
    } catch (err) {
      // Fallback to localhost if internal network DNS is different
      authRes = await fetch('http://127.0.0.1:8090/api/collections/_superusers/auth-with-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email, password }),
      });
    }

    const authData = await authRes.json();

    if (!authRes.ok || !authData.token) {
      return new Response(JSON.stringify({ error: 'Email atau password salah' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Set secure HTTP-only cookie for 7 days
    cookies.set('pb_auth_token', authData.token, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
