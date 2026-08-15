export const prerender = false;

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete('pb_auth_token', { path: '/' });
  return redirect('/admin/login');
};
