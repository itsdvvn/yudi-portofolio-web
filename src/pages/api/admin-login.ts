export const prerender = false;

import type { APIRoute } from 'astro';

// In-memory rate limiting map (IP -> { count, resetTime, lockedUntil })
interface RateLimitEntry {
  count: number;
  resetTime: number;
  lockedUntil?: number;
}

const loginAttempts = new Map<string, RateLimitEntry>();
const MAX_ATTEMPTS = 5; // Max 5 wrong password attempts
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes window
const LOCKOUT_MS = 30 * 60 * 1000; // 30 minutes lockout if exceeded

// Cleanup stale entries every 10 minutes to prevent memory leak
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts.entries()) {
    if (now > entry.resetTime && (!entry.lockedUntil || now > entry.lockedUntil)) {
      loginAttempts.delete(ip);
    }
  }
}, 10 * 60 * 1000);

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  try {
    const ip = clientAddress || request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'unknown-ip';
    const now = Date.now();

    // 1. Check Brute-Force Rate Limit
    let entry = loginAttempts.get(ip);
    if (entry) {
      if (entry.lockedUntil && now < entry.lockedUntil) {
        const remainingMinutes = Math.ceil((entry.lockedUntil - now) / 60000);
        return new Response(JSON.stringify({ 
          error: `Terlalu banyak percobaan gagal. Akses dibatasi sementara selama ${remainingMinutes} menit demi keamanan.` 
        }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      if (now > entry.resetTime) {
        // Reset window
        entry = { count: 0, resetTime: now + WINDOW_MS };
        loginAttempts.set(ip, entry);
      }
    } else {
      entry = { count: 0, resetTime: now + WINDOW_MS };
      loginAttempts.set(ip, entry);
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email dan password wajib diisi' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 2. Authenticate with PocketBase Superuser endpoint
    const pbUrl = 'http://pocketbase-media:8090/api/collections/_superusers/auth-with-password';
    let authRes: globalThis.Response;

    try {
      authRes = await fetch(pbUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email.trim(), password }),
      });
    } catch (err) {
      authRes = await fetch('http://127.0.0.1:8090/api/collections/_superusers/auth-with-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identity: email.trim(), password }),
      });
    }

    const authData = await authRes.json();

    if (!authRes.ok || !authData.token) {
      // Record failed attempt
      entry.count += 1;
      if (entry.count >= MAX_ATTEMPTS) {
        entry.lockedUntil = now + LOCKOUT_MS;
      }
      loginAttempts.set(ip, entry);

      return new Response(JSON.stringify({ error: 'Email atau password salah' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 3. Login Success: Clear rate limit for this IP
    loginAttempts.delete(ip);

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
