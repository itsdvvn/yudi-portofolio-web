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

    // Sembunyikan field input jadwal teknis di tengah form lembar ketik (karena sudah ditangani oleh WordPress Pre-Publish Panel)
    function hideCentralDatetimeFields() {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], input[type="date"], input[type="datetime-local"]')) as HTMLInputElement[];
      inputs.forEach((input) => {
        // Jangan sembunyikan input yang ada di dalam drawer kita
        if (input.closest('#wp-gutenberg-pre-publish-drawer')) return;

        const container = input.closest('label') || input.parentElement?.parentElement || input.parentElement;
        const text = (container?.textContent || '').toLowerCase();

        if (text.includes('jadwal rilis') || text.includes('jadwal / waktu terbit') || text.includes('publication date')) {
          const fieldBlock = input.closest('div[class*="css-"]') || container;
          if (fieldBlock && (fieldBlock as HTMLElement).style.display !== 'none') {
            (fieldBlock as HTMLElement).style.display = 'none';
          }
        }
      });
    }

    // State 2: Pemasangan WordPress Gutenberg Pre-Publish Panel
    function setupWordPressPublishPanel() {
      // Cari tombol aksi utama Keystatic (Save / Create)
      const buttons = Array.from(document.querySelectorAll('button'));
      const mainBtn = buttons.find((b) => {
        const t = b.textContent?.trim();
        return (t === 'Save' || t === 'Create' || t === 'Publish') && !b.dataset.isWpTrigger;
      });

      if (!mainBtn || mainBtn.dataset.hasWpModal === 'true') return;
      mainBtn.dataset.hasWpModal = 'true';

      // Sembunyikan tombol form asli dari pandangan tanpa merusak DOM
      mainBtn.style.opacity = '0';
      mainBtn.style.pointerEvents = 'none';
      mainBtn.style.position = 'absolute';
      mainBtn.style.zIndex = '-1';

      // Buat tombol pengganti "Publish…" bergaya WordPress Gutenberg
      const wpTriggerBtn = document.createElement('button');
      wpTriggerBtn.type = 'button';
      wpTriggerBtn.dataset.isWpTrigger = 'true';
      wpTriggerBtn.textContent = 'Publish…';
      wpTriggerBtn.style.cssText = `
        background-color: #007cba;
        color: #ffffff;
        font-weight: 600;
        font-size: 13px;
        padding: 7px 18px;
        border-radius: 4px;
        border: 1px solid #007cba;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        transition: all 0.15s ease;
      `;
      wpTriggerBtn.onmouseover = () => { wpTriggerBtn.style.backgroundColor = '#006ba1'; };
      wpTriggerBtn.onmouseout = () => { wpTriggerBtn.style.backgroundColor = '#007cba'; };

      mainBtn.parentElement?.appendChild(wpTriggerBtn);

      // Cek apakah form saat ini adalah Artikel yang bertipe Mingguan
      function checkIsWeeklyArticle() {
        const isWritingsPage = window.location.pathname.includes('/writings');
        if (!isWritingsPage) return false;

        // Cari tombol combobox spesifik di bawah field Tipe Publikasi
        const labels = Array.from(document.querySelectorAll('label, div[class*="css-"]'));
        const typeField = labels.find((l) => (l.textContent || '').toLowerCase().includes('tipe publikasi'));
        
        if (typeField) {
          const btn = typeField.querySelector('button[role="combobox"], [aria-haspopup="listbox"], button');
          if (btn) {
            const btnText = (btn.textContent || '').trim().toLowerCase();
            // Jika tombol menampilkan "harian", maka PASTI BUKAN mingguan
            if (btnText.includes('harian')) return false;
            if (btnText.includes('mingguan') || btnText.includes('majalah')) return true;
          }
        }

        // Cek apakah ada input field spesifik Edisi Mingguan yang tampil (seperti field relationship Edisi atau Rubrik)
        const allLabels = Array.from(document.querySelectorAll('label')).map(l => (l.textContent || '').toLowerCase());
        const hasWeeklyFields = allLabels.some(t => t.includes('pilih edisi mingguan') || t.includes('laporan utama (cover story)'));
        if (hasWeeklyFields) return true;

        return false;
      }

      // Buat / Update Modal Panel Pre-Publish (Slide-over Drawer)
      const panelId = 'wp-gutenberg-pre-publish-drawer';
      let drawer = document.getElementById(panelId);
      if (drawer) drawer.remove();

      drawer = document.createElement('div');
      drawer.id = panelId;
      drawer.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 380px;
        max-width: 90vw;
        background: #ffffff;
        border-left: 1px solid #e0e0e0;
        box-shadow: -6px 0 24px rgba(0,0,0,0.15);
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: #1e1e1e;
        flex-direction: column;
      `;

      const now = new Date();
      const currentHh = String(now.getHours()).padStart(2, '0');
      const currentMm = String(now.getMinutes()).padStart(2, '0');
      const currentIsoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      drawer.innerHTML = `
        <!-- Top Action Bar -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid #e0e0e0; background:#f9f9f9;">
          <button type="button" id="wp-drawer-cancel" style="background:transparent; border:1px solid #ccc; border-radius:4px; padding:6px 14px; font-size:13px; font-weight:600; cursor:pointer; color:#1e1e1e;">Cancel</button>
          <button type="button" id="wp-drawer-submit" style="background:#007cba; color:#fff; border:none; border-radius:4px; padding:6px 20px; font-size:13px; font-weight:600; cursor:pointer;">Publish</button>
        </div>

        <!-- Body Content -->
        <div style="padding:20px; overflow-y:auto; flex:1;">
          <h3 style="font-size:16px; font-weight:600; margin:0 0 6px 0; color:#1e1e1e;">Are you ready to publish?</h3>
          <p style="font-size:12px; color:#646970; margin:0 0 20px 0; line-height:1.4;">Double-check your settings before publishing.</p>

          <!-- Weekly Info Notice -->
          <div id="wp-weekly-notice" style="display:none; background:#ecfdf5; border:1px solid #a7f3d0; border-radius:6px; padding:14px; margin-bottom:18px; font-size:12px; color:#065f46; line-height:1.5;">
            <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
              <span>📖</span> Majalah Edisi Mingguan
            </div>
            Jadwal tayang & status rilis artikel ini otomatis mengikuti Edisi Induknya saat diterbitkan.
          </div>

          <!-- Section: Visibility -->
          <div style="border-top:1px solid #e0e0e0; padding:14px 0;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:500;">
              <span>Visibility:</span>
              <span style="color:#007cba; font-weight:600;">Public</span>
            </div>
          </div>

          <!-- Section: Publish Scheduling -->
          <div id="wp-schedule-section" style="border-top:1px solid #e0e0e0; padding:14px 0;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:500; margin-bottom:12px;">
              <span>Publish:</span>
              <span id="wp-schedule-status-text" style="color:#007cba; font-weight:600;">Immediately</span>
            </div>

            <!-- Date & Time Picker Box -->
            <div id="wp-picker-box" style="padding:14px; background:#f6f7f7; border-radius:6px; border:1px solid #dcdcde;">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <span style="font-size:11px; font-weight:700; color:#50575e; text-transform:uppercase;">Jadwal Rilis</span>
                <button type="button" id="wp-btn-now" style="font-size:11px; color:#007cba; background:none; border:none; cursor:pointer; font-weight:600; text-decoration:underline;">Set to Now</button>
              </div>

              <!-- Dedicated Date Picker -->
              <div style="margin-bottom:12px;">
                <label style="display:block; font-size:11px; font-weight:600; color:#50575e; margin-bottom:4px;">📅 Pilih Tanggal</label>
                <input type="date" id="wp-picker-date" value="${currentIsoDate}" style="width:100%; padding:8px 10px; font-size:13px; border:1px solid #8c8f94; border-radius:4px; background:#ffffff; box-sizing:border-box;" />
              </div>

              <!-- Dedicated Time Picker -->
              <div style="margin-bottom:12px;">
                <label style="display:block; font-size:11px; font-weight:600; color:#50575e; margin-bottom:4px;">⏰ Pilih Jam (WIB)</label>
                <input type="time" id="wp-picker-time" value="${currentHh}:${currentMm}" style="width:100%; padding:8px 10px; font-size:13px; border:1px solid #8c8f94; border-radius:4px; background:#ffffff; box-sizing:border-box;" />
              </div>

              <div style="font-size:11px; color:#646970;">Zona waktu sistem: <strong>WIB (UTC+7)</strong></div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(drawer);

      const cancelBtn = drawer.querySelector('#wp-drawer-cancel') as HTMLElement;
      const submitBtn = drawer.querySelector('#wp-drawer-submit') as HTMLButtonElement;
      const datePicker = drawer.querySelector('#wp-picker-date') as HTMLInputElement;
      const timePicker = drawer.querySelector('#wp-picker-time') as HTMLInputElement;
      const statusText = drawer.querySelector('#wp-schedule-status-text') as HTMLElement;
      const nowBtn = drawer.querySelector('#wp-btn-now') as HTMLElement;
      const weeklyNotice = drawer.querySelector('#wp-weekly-notice') as HTMLElement;
      const scheduleSec = drawer.querySelector('#wp-schedule-section') as HTMLElement;

      // Update button label & status text based on selected date & time (Reactive Button Morphing)
      function updateButtonMorph() {
        if (!datePicker || !timePicker) return;
        const dateVal = datePicker.value || currentIsoDate;
        const timeVal = timePicker.value || `${currentHh}:${currentMm}`;
        const combinedIso = `${dateVal}T${timeVal}`;
        const selectedDate = new Date(combinedIso);
        const currentNow = new Date();
        const isFuture = selectedDate.getTime() > currentNow.getTime() + 60000; // toleransi 1 menit

        if (isFuture) {
          submitBtn.textContent = 'Schedule';
          submitBtn.style.backgroundColor = '#4f46e5'; // Indigo untuk Schedule
          statusText.textContent = `${dateVal} ${timeVal} WIB`;
        } else {
          submitBtn.textContent = 'Publish';
          submitBtn.style.backgroundColor = '#007cba'; // Biru untuk Publish Now
          statusText.textContent = 'Immediately';
        }
      }

      datePicker?.addEventListener('change', updateButtonMorph);
      datePicker?.addEventListener('input', updateButtonMorph);
      timePicker?.addEventListener('change', updateButtonMorph);
      timePicker?.addEventListener('input', updateButtonMorph);

      // Event: Buka Drawer
      wpTriggerBtn.addEventListener('click', () => {
        const isWeekly = checkIsWeeklyArticle();
        if (isWeekly) {
          weeklyNotice.style.display = 'block';
          scheduleSec.style.display = 'none';
          submitBtn.textContent = 'Publish to Edition';
          submitBtn.style.backgroundColor = '#10b981';
        } else {
          weeklyNotice.style.display = 'none';
          scheduleSec.style.display = 'block';
          updateButtonMorph();
        }
        drawer.style.display = 'flex';
      });

      // Event: Cancel Drawer
      cancelBtn?.addEventListener('click', () => {
        drawer.style.display = 'none';
      });

      // Event: Set to Now
      nowBtn?.addEventListener('click', () => {
        const n = new Date();
        const hh = String(n.getHours()).padStart(2, '0');
        const mm = String(n.getMinutes()).padStart(2, '0');
        const dIso = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
        if (datePicker) datePicker.value = dIso;
        if (timePicker) timePicker.value = `${hh}:${mm}`;
        updateButtonMorph();
      });

      // Event: Confirm Submit
      submitBtn?.addEventListener('click', () => {
        drawer.style.display = 'none';

        const dateVal = datePicker?.value || currentIsoDate;
        const timeVal = timePicker?.value || `${currentHh}:${currentMm}`;
        const combinedIso = `${dateVal}T${timeVal}`;

        // Cari input datetime/date di form Keystatic asli dan sematkan nilainya
        const keystaticInputs = Array.from(document.querySelectorAll('input[type="datetime-local"], input[type="date"], input[type="text"]')) as HTMLInputElement[];
        for (const input of keystaticInputs) {
          const label = input.closest('label') || input.parentElement;
          const text = (label?.textContent || '').toLowerCase();
          if (text.includes('jadwal') || text.includes('publish') || text.includes('tanggal')) {
            const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (setter) {
              setter.call(input, combinedIso);
              input.dispatchEvent(new Event('input', { bubbles: true }));
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          }
        }

        // Trigger submit form utama Keystatic
        mainBtn.click();
      });
    }

    const interval = setInterval(() => {
      setupCounters();
      hideCentralDatetimeFields();
      setupWordPressPublishPanel();
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return <KeystaticOriginal />;
}

export default KeystaticApp;
