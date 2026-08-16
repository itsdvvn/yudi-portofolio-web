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
        
        // Abaikan jika input berada di dalam Modal Dialog (seperti Modal Edit Sitasi / Komponen Markdoc)
        if (input.closest('[role="dialog"]') || input.closest('dialog')) return;

        const formField = input.closest('label') || input.parentElement?.querySelector('label') || input.parentElement?.parentElement?.querySelector('label') || input.parentElement;
        const allText = ((formField?.textContent || '') + ' ' + (input.getAttribute('aria-label') || '') + ' ' + (input.placeholder || '')).toLowerCase();

        // Hindari pencocokan jika ini adalah field Sumber/Referensi
        if (allText.includes('sumber') || allText.includes('referensi')) return;

        const isTitle = (allText.includes('headline') || allText.includes('judul artikel')) && input.tagName === 'INPUT' && !input.id?.includes('slug');
        const isDeck = (allText.includes('deck') || allText.includes('deskripsi artikel')) && input.tagName === 'TEXTAREA';

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
      badge.style.cssText = 'display:flex; justify-content:flex-end; align-items:center; gap:8px; font-size:11px; font-family:ui-monospace, monospace; margin-top:4px; margin-bottom:4px; padding:0 2px; font-weight:500; width:100%; transition:color 0.15s ease;';

      function update() {
        const len = input.value ? input.value.length : 0;
        const remaining = max - len;
        const isOver = len > max;

        badge.innerHTML = `
          <span>${labelName}: <strong>${len}/${max}</strong> karakter</span>
          <span>•</span>
          <span>${isOver ? '⚠️ Kelebihan ' + Math.abs(remaining) + ' karakter' : 'Sisa ' + remaining + ' karakter'}</span>
        `;

        if (isOver) {
          badge.style.color = '#ef4444';
        } else if (len >= max * 0.85) {
          badge.style.color = '#f59e0b';
        } else {
          badge.style.color = '#71717a';
        }
      }

      ['input', 'change', 'keyup', 'focus', 'paste'].forEach((evt) => {
        input.addEventListener(evt, update);
      });
      update();

      // Cari parent terluar field (container field sebelum field berikutnya)
      // Struktur Keystatic/Keystar: Flex > [Label, Description, InputWrapper, Error]
      const inputOuterWrapper = input.closest('div[class*="css-"]') || input.parentElement;
      if (inputOuterWrapper && inputOuterWrapper.parentElement) {
        inputOuterWrapper.parentElement.appendChild(badge);
      } else {
        input.insertAdjacentElement('afterend', badge);
      }
    }

    const interval = setInterval(setupCounters, 300);
    return () => clearInterval(interval);
  }, []);

  return <KeystaticOriginal />;
}

export default KeystaticApp;
