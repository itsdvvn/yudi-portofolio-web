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
        
        // Abaikan jika input berada di dalam Modal Dialog
        if (input.closest('[role="dialog"]') || input.closest('dialog') || input.closest('#wp-gutenberg-pre-publish-drawer')) return;

        const formField = input.closest('label') || input.parentElement?.querySelector('label') || input.parentElement?.parentElement?.querySelector('label') || input.parentElement;
        const allText = ((formField?.textContent || '') + ' ' + (input.getAttribute('aria-label') || '') + ' ' + (input.placeholder || '')).toLowerCase();

        if (allText.includes('sumber') || allText.includes('referensi') || allText.includes('slug')) return;

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

      input.addEventListener('input', update, { passive: true });
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

    // Sembunyikan field input jadwal & jam teknis di tengah form lembar ketik secara visual
    // Menggunakan clip/opacity agar React event handler tetap aktif menerima input
    function hideCentralDatetimeFields() {
      const inputs = Array.from(document.querySelectorAll('input[type="date"], input[type="datetime-local"], input[type="text"]')) as HTMLInputElement[];
      inputs.forEach((input) => {
        if (input.closest('#wp-gutenberg-pre-publish-drawer')) return;

        const container = input.closest('label') || input.parentElement?.parentElement || input.parentElement;
        const text = (container?.textContent || '').toLowerCase();

        if (
          text.includes('jadwal rilis') || 
          text.includes('jadwal / waktu terbit') || 
          text.includes('tanggal rilis') ||
          text.includes('jam rilis') ||
          text.includes('waktu rilis')
        ) {
          const fieldBlock = (input.closest('div[class*="css-"]') || container) as HTMLElement;
          if (fieldBlock && fieldBlock.style.opacity !== '0') {
            fieldBlock.style.opacity = '0';
            fieldBlock.style.position = 'absolute';
            fieldBlock.style.pointerEvents = 'none';
            fieldBlock.style.height = '0px';
            fieldBlock.style.overflow = 'hidden';
            fieldBlock.style.margin = '0';
            fieldBlock.style.padding = '0';
          }
        }
      });
    }

    // Helper untuk sinkronisasi nilai tanggal & jam ke input form Keystatic asli
    function syncDateToKeystatic(dateVal: string, timeVal?: string) {
      const allInputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
      for (const input of allInputs) {
        if (input.closest('#wp-gutenberg-pre-publish-drawer')) return;
        const container = input.closest('label') || input.parentElement?.parentElement || input.parentElement;
        const text = (container?.textContent || '').toLowerCase();
        
        if (text.includes('tanggal rilis') || text.includes('jadwal rilis') || text.includes('jadwal / waktu terbit')) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (nativeSetter) {
            nativeSetter.call(input, dateVal);
          } else {
            input.value = dateVal;
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true }));
        }

        if (timeVal && (text.includes('jam rilis') || text.includes('waktu rilis'))) {
          const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
          if (nativeSetter) {
            nativeSetter.call(input, timeVal);
          } else {
            input.value = timeVal;
          }
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          input.dispatchEvent(new Event('blur', { bubbles: true }));
        }
      }
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

      datePicker?.addEventListener('change', () => {
        updateButtonMorph();
        syncDateToKeystatic(datePicker.value, timePicker?.value);
      });
      datePicker?.addEventListener('input', () => {
        updateButtonMorph();
        syncDateToKeystatic(datePicker.value, timePicker?.value);
      });
      timePicker?.addEventListener('change', () => {
        updateButtonMorph();
        syncDateToKeystatic(datePicker?.value, timePicker.value);
      });
      timePicker?.addEventListener('input', () => {
        updateButtonMorph();
        syncDateToKeystatic(datePicker?.value, timePicker.value);
      });

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
        const timeNow = `${hh}:${mm}`;
        if (datePicker) datePicker.value = dIso;
        if (timePicker) timePicker.value = timeNow;
        updateButtonMorph();
        syncDateToKeystatic(dIso, timeNow);
      });

      // Event: Confirm Submit
      submitBtn?.addEventListener('click', () => {
        drawer.style.display = 'none';

        const dateVal = datePicker?.value || currentIsoDate;
        const timeVal = timePicker?.value || `${currentHh}:${currentMm}`;
        syncDateToKeystatic(dateVal, timeVal);

        // Delay 100ms agar state React Keystatic selesai meng-update payload form
        setTimeout(() => {
          mainBtn.click();
        }, 100);
      });
    }

    // Enhancer untuk Table List View: Label Status & Quick Actions
    function enhanceTableListView() {
      // Keystar Table menggunakan elemen [role="row"] atau <tr>
      const rows = Array.from(document.querySelectorAll('[role="row"], tr')) as HTMLElement[];
      
      rows.forEach((row) => {
        // Abaikan row header kolom
        if (row.querySelector('[role="columnheader"], th')) return;
        if (row.dataset.hasEnhancement === 'true') return;

        // Cari sel nama atau link item
        const link = row.querySelector('a[href*="/collection/"]') as HTMLAnchorElement | null;
        const cell = row.querySelector('[role="rowheader"], [role="gridcell"], td') as HTMLElement | null;
        if (!link && !cell) return;

        // Baca tanggal (YYYY-MM-DD) dan jam (HH:mm) dari teks seluruh baris tabel
        const cells = Array.from(row.querySelectorAll('[role="gridcell"], [role="rowheader"], td'));
        const rowText = cells.length > 0 ? cells.map(c => c.textContent || '').join(' ') : (row.textContent || '');
        const dateMatch = rowText.match(/\b\d{4}-\d{2}-\d{2}\b/);
        const timeMatch = rowText.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);

        let isFuture = false;
        if (dateMatch) {
          const scheduleDateStr = dateMatch[0];
          const scheduleTimeStr = timeMatch ? timeMatch[0] : '00:00';
          const itemDateTime = new Date(`${scheduleDateStr}T${scheduleTimeStr}:00+07:00`);
          const now = new Date();
          isFuture = itemDateTime.getTime() > now.getTime();
        }

        // Cari atau buat Badge Status
        let badge = row.querySelector('.keystatic-status-badge') as HTMLElement | null;
        if (!badge) {
          badge = document.createElement('span');
          badge.className = 'keystatic-status-badge';
          badge.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 2px 8px;
            border-radius: 9999px;
            font-size: 10px;
            font-weight: 700;
            font-family: ui-monospace, monospace;
            text-transform: uppercase;
            margin-left: 8px;
            letter-spacing: 0.05em;
            vertical-align: middle;
          `;
          const targetAnchor = link || cell?.querySelector('a') || cell;
          if (targetAnchor) {
            targetAnchor.appendChild(badge);
          }
        }

        // Update status badge secara reaktif setiap detik/interval
        if (isFuture) {
          badge.textContent = '⏰ SCHEDULED';
          badge.style.backgroundColor = '#ede9fe';
          badge.style.color = '#6d28d9';
          badge.style.border = '1px solid #c4b5fd';
        } else {
          badge.textContent = '🟢 PUBLISHED';
          badge.style.backgroundColor = '#ecfdf5';
          badge.style.color = '#047857';
          badge.style.border = '1px solid #a7f3d0';
        }

        // 2. Quick Action Toolbar
        if (link && link.href && !row.querySelector('.keystatic-row-actions')) {
          const urlParts = link.href.split('/item/');
          const itemSlug = urlParts[1];
          if (itemSlug) {
            const isEditions = link.href.includes('/collection/editions');
            const webUrl = isEditions ? '/writings#mingguan' : `/writings/${itemSlug}`;

            const actionWrapper = document.createElement('div');
            actionWrapper.className = 'keystatic-row-actions';
            actionWrapper.style.cssText = 'display: inline-flex; align-items: center; gap: 6px; margin-left: auto; padding-left: 12px;';

            const viewBtn = document.createElement('a');
            viewBtn.href = webUrl;
            viewBtn.target = '_blank';
            viewBtn.rel = 'noopener noreferrer';
            viewBtn.textContent = '↗ View';
            viewBtn.title = 'Buka artikel di website publik';
            viewBtn.style.cssText = `
              padding: 2px 7px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 600;
              background: #ffffff;
              color: #2563eb;
              border: 1px solid #93c5fd;
              text-decoration: none;
              cursor: pointer;
            `;
            viewBtn.addEventListener('click', (e) => e.stopPropagation());

            actionWrapper.appendChild(viewBtn);

            const lastCell = row.querySelector('[role="gridcell"]:last-child, td:last-child') as HTMLElement | null;
            if (lastCell) {
              lastCell.style.display = 'flex';
              lastCell.style.alignItems = 'center';
              lastCell.style.justifyContent = 'space-between';
              lastCell.appendChild(actionWrapper);
            }
          }
        }
      });
    }

    const interval = setInterval(() => {
      setupCounters();
      hideCentralDatetimeFields();
      setupWordPressPublishPanel();
      enhanceTableListView();
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return <KeystaticOriginal />;
}

export default KeystaticApp;
