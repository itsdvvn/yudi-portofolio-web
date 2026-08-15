import React, { useEffect } from 'react';
import { makePage } from '@keystatic/astro/ui';
import config from '../../keystatic.config';

const KeystaticOriginal = makePage(config);

export function KeystaticApp() {
  useEffect(() => {
    function setupCounters() {
      const inputs = document.querySelectorAll('input[type="text"], textarea');
      inputs.forEach((el) => {
        const input = el as HTMLInputElement | HTMLTextAreaElement;
        const formField = input.closest('label') || input.parentElement?.querySelector('label') || input.parentElement?.parentElement?.querySelector('label') || input.parentElement;
        const allText = ((formField?.textContent || '') + ' ' + (input.getAttribute('aria-label') || '') + ' ' + (input.placeholder || '')).toLowerCase();

        const isTitle = (allText.includes('headline') || allText.includes('judul')) && input.tagName === 'INPUT' && !input.id?.includes('slug');
        const isDeck = (allText.includes('deck') || allText.includes('deskripsi') || allText.includes('subheadline')) && input.tagName === 'TEXTAREA';

        if (isTitle) {
          attachBadge(input, 80, 'Judul Artikel');
        } else if (isDeck) {
          attachBadge(input, 144, 'Deskripsi Artikel');
        }
      });
    }

    function attachBadge(input: HTMLInputElement | HTMLTextAreaElement, max: number, labelName: string) {
      if (input.dataset.hasLiveCounter === 'true') return;
      input.dataset.hasLiveCounter = 'true';

      const badge = document.createElement('div');
      badge.style.cssText = 'display:flex; justify-content:space-between; align-items:center; font-size:11px; font-family:monospace; margin-top:5px; padding:4px 8px; border-radius:4px; font-weight:600; width:100%; box-sizing:border-box; transition:all 0.15s ease;';

      function update() {
        const len = input.value ? input.value.length : 0;
        const remaining = max - len;
        const isOver = len > max;

        badge.innerHTML = `
          <span>📊 ${labelName}: <strong>${len}/${max}</strong> karakter</span>
          <span>${isOver ? '⚠️ Kelebihan ' + Math.abs(remaining) + ' karakter' : 'Sisa ' + remaining + ' karakter'}</span>
        `;

        if (isOver) {
          badge.style.color = '#ef4444';
          badge.style.backgroundColor = 'rgba(239, 68, 68, 0.12)';
          badge.style.border = '1px solid rgba(239, 68, 68, 0.35)';
        } else if (len >= max * 0.85) {
          badge.style.color = '#f59e0b';
          badge.style.backgroundColor = 'rgba(245, 158, 11, 0.1)';
          badge.style.border = '1px solid rgba(245, 158, 11, 0.25)';
        } else {
          badge.style.color = '#10b981';
          badge.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
          badge.style.border = '1px solid rgba(16, 185, 129, 0.2)';
        }
      }

      ['input', 'change', 'keyup', 'focus', 'paste'].forEach((evt) => {
        input.addEventListener(evt, update);
      });
      update();

      if (input.nextSibling) {
        input.parentNode?.insertBefore(badge, input.nextSibling);
      } else {
        input.parentNode?.appendChild(badge);
      }
    }

    const interval = setInterval(setupCounters, 300);
    return () => clearInterval(interval);
  }, []);

  return <KeystaticOriginal />;
}

export default KeystaticApp;
