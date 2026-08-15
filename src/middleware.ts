import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const pathname = context.url.pathname;

  // Protect /keystatic and /admin routes (except /admin/login and /api/admin-login)
  const isProtectedPath = 
    pathname.startsWith('/keystatic') || 
    (pathname.startsWith('/admin') && pathname !== '/admin/login');

  if (isProtectedPath) {
    const token = context.cookies.get('pb_auth_token')?.value;

    if (!token) {
      return context.redirect('/admin/login');
    }

    // Quick verification of token payload structure
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        context.cookies.delete('pb_auth_token', { path: '/' });
        return context.redirect('/admin/login');
      }

      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
      const now = Math.floor(Date.now() / 1000);

      // Token expired check
      if (payload.exp && payload.exp < now) {
        context.cookies.delete('pb_auth_token', { path: '/' });
        return context.redirect('/admin/login');
      }
    } catch (e) {
      context.cookies.delete('pb_auth_token', { path: '/' });
      return context.redirect('/admin/login');
    }
  }

  return next();
});
