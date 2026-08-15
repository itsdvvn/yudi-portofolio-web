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

  const response = await next();

  // Inject Real-time Character Counter Script for Keystatic CMS Admin
  if (pathname.startsWith('/keystatic')) {
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      const originalHtml = await response.text();
      const injectedScript = `
        <script>
          (function() {
            function setupCharacterCounters() {
              // 1. Target Title / Headline Input
              const inputs = document.querySelectorAll('input[type="text"]');
              inputs.forEach(input => {
                const label = input.closest('label') || input.parentElement?.querySelector('label') || input.parentElement?.parentElement?.querySelector('label');
                const labelText = (label?.textContent || '').toLowerCase();
                const placeholder = (input.getAttribute('placeholder') || '').toLowerCase();

                if (labelText.includes('headline') || labelText.includes('judul') || placeholder.includes('headline') || placeholder.includes('judul')) {
                  attachCounter(input, 80, 'Judul');
                }
              });

              // 2. Target Deck / Deskripsi Textarea
              const textareas = document.querySelectorAll('textarea');
              textareas.forEach(textarea => {
                const label = textarea.closest('label') || textarea.parentElement?.querySelector('label') || textarea.parentElement?.parentElement?.querySelector('label');
                const labelText = (label?.textContent || '').toLowerCase();

                if (labelText.includes('deck') || labelText.includes('deskripsi') || labelText.includes('subheadline')) {
                  attachCounter(textarea, 144, 'Deskripsi');
                }
              });
            }

            function attachCounter(elem, maxLen, labelName) {
              if (elem.dataset.counterAttached) return;
              elem.dataset.counterAttached = 'true';

              const counterBox = document.createElement('div');
              counterBox.style.display = 'flex';
              counterBox.style.justifyContent = 'space-between';
              counterBox.style.alignItems = 'center';
              counterBox.style.fontSize = '11px';
              counterBox.style.fontFamily = 'monospace';
              counterBox.style.marginTop = '4px';
              counterBox.style.padding = '2px 4px';
              counterBox.style.borderRadius = '4px';
              counterBox.style.transition = 'all 0.2s ease';

              function updateCount() {
                const currentLen = elem.value.length;
                const remaining = maxLen - currentLen;
                const isOver = currentLen > maxLen;

                counterBox.innerHTML = \`
                  <span>\${labelName}: \${currentLen} / \${maxLen} karakter</span>
                  <span>\${isOver ? '⚠️ Melebihi ' + Math.abs(remaining) + ' karakter' : 'Sisa ' + remaining + ' karakter'}</span>
                \`;

                if (isOver) {
                  counterBox.style.color = '#ef4444';
                  counterBox.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                  counterBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                  elem.style.borderColor = '#ef4444';
                } else if (currentLen > maxLen * 0.85) {
                  counterBox.style.color = '#f59e0b';
                  counterBox.style.backgroundColor = 'rgba(245, 158, 11, 0.08)';
                  counterBox.style.border = '1px solid rgba(245, 158, 11, 0.2)';
                  elem.style.borderColor = '';
                } else {
                  counterBox.style.color = '#10b981';
                  counterBox.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
                  counterBox.style.border = '1px solid rgba(16, 185, 129, 0.2)';
                  elem.style.borderColor = '';
                }
              }

              elem.addEventListener('input', updateCount);
              elem.addEventListener('change', updateCount);
              elem.addEventListener('keyup', updateCount);
              updateCount();

              elem.insertAdjacentElement('afterend', counterBox);
            }

            // Observe DOM changes in Keystatic SPA
            const observer = new MutationObserver(() => {
              setupCharacterCounters();
            });

            observer.observe(document.body, { childList: true, subtree: true });
            setInterval(setupCharacterCounters, 800);
            window.addEventListener('load', setupCharacterCounters);
          })();
        </script>
      `;

      const modifiedHtml = originalHtml.includes('</body>') 
        ? originalHtml.replace('</body>', `${injectedScript}</body>`)
        : originalHtml + injectedScript;

      const newResponse = new Response(modifiedHtml, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });

      newResponse.headers.set('X-Content-Type-Options', 'nosniff');
      newResponse.headers.set('X-Frame-Options', 'SAMEORIGIN');
      newResponse.headers.set('X-XSS-Protection', '1; mode=block');
      newResponse.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
      newResponse.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

      return newResponse;
    }
  }

  // Apply strict HTTP Security Headers to prevent clickjacking, MIME sniffing, and browser injections
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  return response;
});
