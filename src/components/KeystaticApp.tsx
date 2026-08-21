import React, { useEffect } from 'react';
import { makePage } from '@keystatic/astro/ui';
import config from '../../keystatic.config';

const KeystaticOriginal = makePage(config);

export function KeystaticApp() {
  useEffect(() => {
    // Live character counter murni yang membaca value dan menampilkan counter di header label field secara non-intrusif
    function updateFieldCounters() {
      const inputs = Array.from(document.querySelectorAll('input[type="text"], textarea')) as (HTMLInputElement | HTMLTextAreaElement)[];
      
      inputs.forEach((input) => {
        if (input.closest('#wp-gutenberg-pre-publish-drawer') || input.closest('[role="dialog"]')) return;

        // Cari label atau container field
        const labelEl = input.closest('label') || input.parentElement?.querySelector('label') || input.parentElement?.parentElement?.querySelector('label');
        const labelText = (labelEl?.textContent || '').toLowerCase();
        
        const isTitle = (labelText.includes('headline') || labelText.includes('judul artikel')) && input.tagName === 'INPUT' && !input.id?.includes('slug');
        const isDeck = (labelText.includes('deck') || labelText.includes('deskripsi artikel')) && input.tagName === 'TEXTAREA';

        if (!isTitle && !isDeck) return;

        const targetLabel = labelEl || input.parentElement?.parentElement?.querySelector('label, [role="heading"], span');
        if (!targetLabel) return;

        const max = isTitle ? 80 : 144;
        const name = isTitle ? 'Judul Artikel' : 'Deskripsi Artikel';
        const len = input.value ? input.value.length : 0;
        const remaining = max - len;
        const isOver = len > max;

        // Cari atau buat wadah counter di dalam label header
        let counterEl = targetLabel.querySelector('.keystatic-live-counter') as HTMLElement | null;
        if (!counterEl) {
          counterEl = document.createElement('span');
          counterEl.className = 'keystatic-live-counter';
          counterEl.style.cssText = `
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 11px;
            font-family: ui-monospace, monospace;
            font-weight: 600;
            margin-left: 12px;
            pointer-events: none;
            user-select: none;
            vertical-align: middle;
          `;
          targetLabel.appendChild(counterEl);
        }

        counterEl.innerHTML = `
          <span>•</span>
          <span>${len}/${max} karakter (${isOver ? '⚠️ Kelebihan ' + Math.abs(remaining) : 'Sisa ' + remaining})</span>
        `;

        if (isOver) {
          counterEl.style.color = '#ef4444';
        } else if (len >= max * 0.85) {
          counterEl.style.color = '#f59e0b';
        } else {
          counterEl.style.color = '#059669';
        }
      });
    }

    // Sembunyikan field input jadwal & jam teknis di tengah form lembar ketik secara visual
    // Menggunakan clip/opacity/height agar React event handler tetap aktif menerima input dari drawer WordPress
    function hideCentralDatetimeFields() {
      // HANYA jalankan saat berada di halaman form edit / create item
      const pathname = window.location.pathname;
      const isFormEditorPage = pathname.includes('/create') || pathname.includes('/item/');
      if (!isFormEditorPage) return;

      // Cari semua label atau teks heading yang memuat kata jadwal rilis / jam rilis
      const labelsAndDivs = Array.from(document.querySelectorAll('label, div[class*="css-"], h3, span, p')) as HTMLElement[];
      labelsAndDivs.forEach((el) => {
        if (el.closest('#wp-gutenberg-pre-publish-drawer') || el.closest('[role="dialog"]')) return;
        const text = (el.textContent || '').trim().toLowerCase();

        if (
          text.startsWith('jadwal rilis majalah') ||
          text.startsWith('jam rilis majalah') ||
          text.startsWith('tanggal rilis artikel') ||
          text.startsWith('jam rilis artikel') ||
          text.startsWith('jadwal rilis') ||
          text.startsWith('tanggal rilis') ||
          text.startsWith('jam rilis') ||
          text.startsWith('sudah pernah dirilis') ||
          text.includes('hasbeenpublished')
        ) {
          // Cari container terdekat dari field tersebut
          const fieldBlock = (el.closest('[role="group"]') || el.closest('div[class*="css-"]') || el.parentElement?.parentElement || el.parentElement) as HTMLElement;
          if (fieldBlock && fieldBlock !== document.body && fieldBlock.style.display !== 'none') {
            fieldBlock.style.display = 'none';
            fieldBlock.style.position = 'absolute';
            fieldBlock.style.pointerEvents = 'none';
            fieldBlock.style.height = '0px';
            fieldBlock.style.overflow = 'hidden';
          }
        }
      });
    }

    // Helper untuk sinkronisasi nilai tanggal & jam rilis
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

    // Helper untuk sinkronisasi tanggal & jam terakhir diperbarui (updatedDate & updatedTime)
    function syncUpdatedDateToKeystatic(dateVal: string, timeVal?: string) {
      const allInputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
      for (const input of allInputs) {
        if (input.closest('#wp-gutenberg-pre-publish-drawer')) return;
        const container = input.closest('label') || input.parentElement?.parentElement || input.parentElement;
        const text = (container?.textContent || '').toLowerCase();
        
        if (text.includes('terakhir diperbarui') || text.includes('updateddate')) {
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

        if (timeVal && (text.includes('jam terakhir') || text.includes('updatedtime'))) {
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

    // Helper untuk sinkronisasi flag hasBeenPublished ke Keystatic
    function syncHasBeenPublishedToKeystatic(isPublished: boolean) {
      const allCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
      for (const cb of allCheckboxes) {
        if (cb.closest('#wp-gutenberg-pre-publish-drawer')) continue;
        const container = cb.closest('label') || cb.parentElement?.parentElement || cb.parentElement;
        const text = (container?.textContent || '').toLowerCase();
        if (text.includes('sudah pernah dirilis') || text.includes('hasbeenpublished')) {
          if (cb.checked !== isPublished) {
            cb.checked = isPublished;
            cb.dispatchEvent(new Event('input', { bubbles: true }));
            cb.dispatchEvent(new Event('change', { bubbles: true }));
            cb.dispatchEvent(new Event('blur', { bubbles: true }));
          }
        }
      }
    }

    // State 2: Pemasangan WordPress Gutenberg Pre-Publish Panel & Update Button
    function setupWordPressPublishPanel() {
      // HANYA pasang tombol Publish/Update & Drawer pada artikel Writings & Majalah Editions
      const pathname = window.location.pathname;
      const isScheduledContent = pathname.includes('/collection/writings/') || pathname.includes('/collection/editions/');
      if (!isScheduledContent) return;

      const isEditItem = pathname.includes('/item/');

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

      // Cek apakah form saat ini mencentang opsi Draft
      function checkIsDraftChecked(): boolean {
        const allCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
        for (const cb of allCheckboxes) {
          const container = cb.closest('label') || cb.parentElement?.parentElement || cb.parentElement;
          const text = (container?.textContent || '').toLowerCase();
          if (text.includes('draft')) {
            return cb.checked;
          }
        }
        return false;
      }

      // Cek apakah item sudah pernah dirilis secara resmi (bukan draft baru)
      function checkIsItemAlreadyPublished() {
        if (!isEditItem) return false;
        
        // 1. Cek langsung checkbox hasBeenPublished di form
        const allCheckboxes = Array.from(document.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
        for (const cb of allCheckboxes) {
          const container = cb.closest('label') || cb.parentElement?.parentElement || cb.parentElement;
          const text = (container?.textContent || '').toLowerCase();
          if (text.includes('sudah pernah dirilis') || text.includes('hasbeenpublished')) {
            return cb.checked;
          }
        }

        // 2. Jika field hasBeenPublished belum ada pada artikel legacy, cek apakah ada updatedDate/updatedTime
        const allInputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
        for (const input of allInputs) {
          const container = input.closest('label') || input.parentElement?.parentElement || input.parentElement;
          const text = (container?.textContent || '').toLowerCase();
          if (text.includes('terakhir diperbarui') || text.includes('updateddate')) {
            if (input.value) return true;
          }
        }

        return false;
      }

      function getIsPublishedItem(): boolean {
        const isDraft = checkIsDraftChecked();
        if (isDraft) return false;
        return isEditItem && checkIsItemAlreadyPublished();
      }

      // Buat tombol pengganti "Publish…", "Update", atau "Save Draft"
      const wpTriggerBtn = document.createElement('button');
      wpTriggerBtn.type = 'button';
      wpTriggerBtn.dataset.isWpTrigger = 'true';
      wpTriggerBtn.style.cssText = `
        color: #ffffff;
        font-weight: 600;
        font-size: 13px;
        padding: 7px 18px;
        border-radius: 4px;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.1);
        transition: all 0.15s ease;
      `;

      function updateWpTriggerBtnState() {
        const isDraft = checkIsDraftChecked();
        const isPublished = getIsPublishedItem();

        if (isDraft) {
          wpTriggerBtn.textContent = 'Save Draft';
          wpTriggerBtn.style.backgroundColor = '#4b5563';
          wpTriggerBtn.style.border = '1px solid #4b5563';
          wpTriggerBtn.onmouseover = () => { wpTriggerBtn.style.backgroundColor = '#374151'; };
          wpTriggerBtn.onmouseout = () => { wpTriggerBtn.style.backgroundColor = '#4b5563'; };
        } else if (isPublished) {
          wpTriggerBtn.textContent = 'Update';
          wpTriggerBtn.style.backgroundColor = '#059669';
          wpTriggerBtn.style.border = '1px solid #059669';
          wpTriggerBtn.onmouseover = () => { wpTriggerBtn.style.backgroundColor = '#047857'; };
          wpTriggerBtn.onmouseout = () => { wpTriggerBtn.style.backgroundColor = '#059669'; };
        } else {
          wpTriggerBtn.textContent = 'Publish…';
          wpTriggerBtn.style.backgroundColor = '#007cba';
          wpTriggerBtn.style.border = '1px solid #007cba';
          wpTriggerBtn.onmouseover = () => { wpTriggerBtn.style.backgroundColor = '#006ba1'; };
          wpTriggerBtn.onmouseout = () => { wpTriggerBtn.style.backgroundColor = '#007cba'; };
        }
      }

      updateWpTriggerBtnState();

      // Pasang listener jika user mencentang/uncheck Draft
      document.addEventListener('change', () => {
        updateWpTriggerBtnState();
      });
      document.addEventListener('click', () => {
        setTimeout(updateWpTriggerBtnState, 50);
      });

      mainBtn.parentElement?.appendChild(wpTriggerBtn);

      // Cek apakah form saat ini adalah Artikel yang bertipe Mingguan
      function checkIsWeeklyArticle() {
        const isWritingsPage = window.location.pathname.includes('/writings');
        if (!isWritingsPage) return false;

        const labels = Array.from(document.querySelectorAll('label, div[class*="css-"]'));
        const typeField = labels.find((l) => (l.textContent || '').toLowerCase().includes('tipe publikasi'));
        
        if (typeField) {
          const btn = typeField.querySelector('button[role="combobox"], [aria-haspopup="listbox"], button');
          if (btn) {
            const btnText = (btn.textContent || '').trim().toLowerCase();
            if (btnText.includes('harian')) return false;
            if (btnText.includes('mingguan') || btnText.includes('majalah')) return true;
          }
        }

        const allLabels = Array.from(document.querySelectorAll('label')).map(l => (l.textContent || '').toLowerCase());
        const hasWeeklyFields = allLabels.some(t => t.includes('pilih edisi mingguan') || t.includes('laporan utama (cover story)'));
        if (hasWeeklyFields) return true;

        return false;
      }

      // Buat Modal Panel Drawer
      const panelId = 'wp-gutenberg-pre-publish-drawer';
      const backdropId = 'wp-gutenberg-drawer-backdrop';
      
      let backdrop = document.getElementById(backdropId);
      if (backdrop) backdrop.remove();
      let drawer = document.getElementById(panelId);
      if (drawer) drawer.remove();

      backdrop = document.createElement('div');
      backdrop.id = backdropId;
      backdrop.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(2px);
        z-index: 99998;
        transition: opacity 0.2s ease;
      `;
      document.body.appendChild(backdrop);

      drawer = document.createElement('div');
      drawer.id = panelId;
      drawer.className = 'wp-drawer-container';
      drawer.style.cssText = `
        display: none;
        position: fixed;
        top: 0;
        right: 0;
        bottom: 0;
        width: 380px;
        max-width: 90vw;
        background: var(--wp-drawer-bg, #ffffff);
        border-left: 1px solid var(--wp-drawer-border, #e0e0e0);
        box-shadow: -8px 0 32px rgba(0,0,0,0.25);
        z-index: 99999;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        color: var(--wp-drawer-text, #1e1e1e);
        flex-direction: column;
      `;

      if (!document.getElementById('wp-drawer-styles')) {
        const styleSheet = document.createElement('style');
        styleSheet.id = 'wp-drawer-styles';
        styleSheet.textContent = `
          :root,
          .kui-scheme--light {
            --wp-drawer-bg: #ffffff;
            --wp-drawer-header-bg: #f8fafc;
            --wp-drawer-text: #0f172a;
            --wp-drawer-muted: #64748b;
            --wp-drawer-border: #e2e8f0;
            --wp-drawer-card-bg: #f1f5f9;
            --wp-drawer-input-bg: #ffffff;
            --wp-drawer-input-border: #cbd5e1;
            --wp-drawer-input-text: #0f172a;
            --wp-drawer-color-scheme: light;
            --wp-calendar-icon-filter: none;
          }

          html.kui-scheme--dark,
          body.kui-scheme--dark,
          .kui-scheme--dark,
          [data-color-scheme="dark"] {
            --wp-drawer-bg: #18181b !important;
            --wp-drawer-header-bg: #202024 !important;
            --wp-drawer-text: #f4f4f5 !important;
            --wp-drawer-muted: #a1a1aa !important;
            --wp-drawer-border: #27272a !important;
            --wp-drawer-card-bg: #27272a !important;
            --wp-drawer-input-bg: #18181b !important;
            --wp-drawer-input-border: #3f3f46 !important;
            --wp-drawer-input-text: #f4f4f5 !important;
            --wp-drawer-color-scheme: dark !important;
            --wp-calendar-icon-filter: invert(1) !important;
          }

          .wp-drawer-container {
            background: var(--wp-drawer-bg) !important;
            border-left: 1px solid var(--wp-drawer-border) !important;
            color: var(--wp-drawer-text) !important;
          }

          .wp-custom-input {
            color-scheme: var(--wp-drawer-color-scheme) !important;
            color: var(--wp-drawer-input-text) !important;
            background-color: var(--wp-drawer-input-bg) !important;
            border: 1px solid var(--wp-drawer-input-border) !important;
          }

          .wp-custom-input::-webkit-calendar-picker-indicator {
            cursor: pointer;
            filter: var(--wp-calendar-icon-filter) !important;
          }
        `;
        document.head.appendChild(styleSheet);
      }

      const now = new Date();
      const currentHh = String(now.getHours()).padStart(2, '0');
      const currentMm = String(now.getMinutes()).padStart(2, '0');
      const currentIsoDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      drawer.innerHTML = `
        <!-- Top Action Bar -->
        <div style="display:flex; align-items:center; justify-content:space-between; padding:14px 18px; border-bottom:1px solid var(--wp-drawer-border); background:var(--wp-drawer-header-bg);">
          <button type="button" id="wp-drawer-cancel" style="background:transparent; border:1px solid var(--wp-drawer-border); border-radius:4px; padding:6px 14px; font-size:13px; font-weight:600; cursor:pointer; color:var(--wp-drawer-text);">Cancel</button>
          <button type="button" id="wp-drawer-submit" style="background:${isPublishedItem ? '#059669' : '#007cba'}; color:#fff; border:none; border-radius:4px; padding:6px 20px; font-size:13px; font-weight:600; cursor:pointer;">
            ${isPublishedItem ? 'Update' : 'Publish'}
          </button>
        </div>

        <!-- Body Content -->
        <div style="padding:20px; overflow-y:auto; flex:1;">
          <h3 style="font-size:16px; font-weight:600; margin:0 0 6px 0; color:var(--wp-drawer-text);">
            ${isPublishedItem ? 'Perbarui Artikel (Update)' : 'Are you ready to publish?'}
          </h3>
          <p style="font-size:12px; color:var(--wp-drawer-muted); margin:0 0 20px 0; line-height:1.4;">
            ${isPublishedItem ? 'Simpan revisi konten. Waktu pembaruan (terakhir diperbarui) akan dicatat otomatis.' : 'Double-check your settings before publishing.'}
          </p>

          <!-- Update Revision Notice Box -->
          ${isPublishedItem ? `
            <div style="background:rgba(5, 150, 105, 0.08); border:1px solid rgba(5, 150, 105, 0.25); border-radius:6px; padding:14px; margin-bottom:16px; font-size:12px; color:#059669; line-height:1.5;">
              <div style="font-weight:700; margin-bottom:6px; display:flex; align-items:center; gap:6px; font-size:13px;">
                <span>🟢</span> Artikel Sudah Terbit (Published)
              </div>
              <div style="color:var(--wp-drawer-text); margin-bottom:4px;">
                📅 Tanggal Rilis Asli: <strong id="wp-published-date-badge" style="color:#059669;">-</strong> (Terkunci & Aman)
              </div>
              <div style="color:var(--wp-drawer-muted); font-size:11px; margin-top:6px;">
                Menekan tombol <strong>Update</strong> akan menyimpan isi konten Anda dan mencatat waktu revisi terkini tanpa mengubah tanggal rilis aslinya.
              </div>
            </div>
          ` : ''}

          <!-- Weekly Info Notice -->
          <div id="wp-weekly-notice" style="display:none; background:rgba(16, 185, 129, 0.1); border:1px solid rgba(16, 185, 129, 0.3); border-radius:6px; padding:14px; margin-bottom:18px; font-size:12px; color:#10b981; line-height:1.5;">
            <div style="font-weight:700; margin-bottom:4px; display:flex; align-items:center; gap:6px;">
              <span>📖</span> Majalah Edisi Mingguan
            </div>
            Jadwal tayang & status rilis artikel ini otomatis mengikuti Edisi Induknya saat diterbitkan.
          </div>

          <!-- Section: Visibility -->
          <div style="border-top:1px solid var(--wp-drawer-border); padding:14px 0;">
            <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:500;">
              <span style="color:var(--wp-drawer-text);">Visibility:</span>
              <span style="color:#007cba; font-weight:600;">Public</span>
            </div>
          </div>

          ${isPublishedItem ? `
            <!-- Optional Override Publish Date for Existing Articles -->
            <div style="border-top:1px solid var(--wp-drawer-border); padding:14px 0;">
              <label style="display:flex; align-items:center; gap:8px; font-size:12px; font-weight:600; cursor:pointer; color:var(--wp-drawer-text); user-select:none;">
                <input type="checkbox" id="wp-enable-override-date" style="cursor:pointer; width:14px; height:14px;" />
                <span>Ubah tanggal rilis asli secara manual (Opsional)</span>
              </label>
              <div id="wp-override-date-box" style="display:none; padding:12px; background:var(--wp-drawer-card-bg); border-radius:6px; border:1px solid var(--wp-drawer-border); margin-top:10px;">
                <div style="margin-bottom:10px;">
                  <label style="display:block; font-size:11px; font-weight:600; color:var(--wp-drawer-muted); margin-bottom:4px;">📅 Tanggal Rilis Baru</label>
                  <input type="date" id="wp-picker-date" class="wp-custom-input" style="width:100%; padding:7px 10px; font-size:13px; border-radius:4px; box-sizing:border-box; outline:none;" />
                </div>
                <div>
                  <label style="display:block; font-size:11px; font-weight:600; color:var(--wp-drawer-muted); margin-bottom:4px;">⏰ Jam Rilis Baru (WIB)</label>
                  <input type="time" id="wp-picker-time" class="wp-custom-input" style="width:100%; padding:7px 10px; font-size:13px; border-radius:4px; box-sizing:border-box; outline:none;" />
                </div>
              </div>
            </div>
          ` : `
            <!-- Section: Publish Scheduling for New Articles -->
            <div id="wp-schedule-section" style="border-top:1px solid var(--wp-drawer-border); padding:14px 0;">
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:13px; font-weight:500; margin-bottom:12px;">
                <span style="color:var(--wp-drawer-text);">Publish:</span>
                <span id="wp-schedule-status-text" style="color:#007cba; font-weight:600;">
                  Immediately
                </span>
              </div>

              <!-- Date & Time Picker Box -->
              <div id="wp-picker-box" style="padding:14px; background:var(--wp-drawer-card-bg); border-radius:6px; border:1px solid var(--wp-drawer-border);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <span style="font-size:11px; font-weight:700; color:var(--wp-drawer-muted); text-transform:uppercase;">
                    Jadwal Rilis
                  </span>
                  <button type="button" id="wp-btn-now" style="font-size:11px; color:#38bdf8; background:none; border:none; cursor:pointer; font-weight:600; text-decoration:underline;">Set to Now</button>
                </div>

                <div style="margin-bottom:12px;">
                  <label style="display:block; font-size:11px; font-weight:600; color:var(--wp-drawer-muted); margin-bottom:4px;">📅 Tanggal Rilis</label>
                  <input type="date" id="wp-picker-date" class="wp-custom-input" value="${currentIsoDate}" style="width:100%; padding:8px 10px; font-size:13px; border-radius:4px; box-sizing:border-box; outline:none;" />
                </div>

                <div style="margin-bottom:12px;">
                  <label style="display:block; font-size:11px; font-weight:600; color:var(--wp-drawer-muted); margin-bottom:4px;">⏰ Jam (WIB)</label>
                  <input type="time" id="wp-picker-time" class="wp-custom-input" value="${currentHh}:${currentMm}" style="width:100%; padding:8px 10px; font-size:13px; border-radius:4px; box-sizing:border-box; outline:none;" />
                </div>

                <div style="font-size:11px; color:var(--wp-drawer-muted);">Zona waktu sistem: <strong style="color:var(--wp-drawer-text);">WIB (UTC+7)</strong></div>
              </div>
            </div>
          `}
        </div>
      `;

      document.body.appendChild(drawer);

      const cancelBtn = drawer.querySelector('#wp-drawer-cancel') as HTMLElement;
      const submitBtn = drawer.querySelector('#wp-drawer-submit') as HTMLButtonElement;
      const datePicker = drawer.querySelector('#wp-picker-date') as HTMLInputElement | null;
      const timePicker = drawer.querySelector('#wp-picker-time') as HTMLInputElement | null;
      const statusText = drawer.querySelector('#wp-schedule-status-text') as HTMLElement | null;
      const nowBtn = drawer.querySelector('#wp-btn-now') as HTMLElement | null;
      const weeklyNotice = drawer.querySelector('#wp-weekly-notice') as HTMLElement | null;
      const scheduleSec = drawer.querySelector('#wp-schedule-section') as HTMLElement | null;
      const overrideCheckbox = drawer.querySelector('#wp-enable-override-date') as HTMLInputElement | null;
      const overrideBox = drawer.querySelector('#wp-override-date-box') as HTMLElement | null;
      const pubDateBadge = drawer.querySelector('#wp-published-date-badge') as HTMLElement | null;

      if (overrideCheckbox && overrideBox) {
        overrideCheckbox.addEventListener('change', () => {
          overrideBox.style.display = overrideCheckbox.checked ? 'block' : 'none';
        });
      }

      function closeDrawer() {
        if (drawer) drawer.style.display = 'none';
        if (backdrop) backdrop.style.display = 'none';
      }

      function getExistingPublishDateTime() {
        let existingDate = '';
        let existingTime = '';
        const allInputs = Array.from(document.querySelectorAll('input')) as HTMLInputElement[];
        for (const input of allInputs) {
          if (input.closest('#wp-gutenberg-pre-publish-drawer')) continue;
          const container = input.closest('label') || input.parentElement?.parentElement || input.parentElement;
          const text = (container?.textContent || '').toLowerCase();
          if (text.includes('tanggal rilis') || text.includes('jadwal rilis') || text.includes('jadwal / waktu terbit')) {
            if (input.value) existingDate = input.value;
          }
          if (text.includes('jam rilis') || text.includes('waktu rilis')) {
            if (input.value) existingTime = input.value;
          }
        }
        return { existingDate, existingTime };
      }

      function openDrawer() {
        const { existingDate, existingTime } = getExistingPublishDateTime();
        const isPublished = getIsPublishedItem();
        
        if (pubDateBadge) {
          pubDateBadge.textContent = existingDate ? `${existingDate} ${existingTime ? existingTime + ' WIB' : ''}` : 'Published';
        }

        if (existingDate && datePicker) {
          datePicker.value = existingDate;
        }
        if (existingTime && timePicker) {
          timePicker.value = existingTime;
        }

        const isWeekly = checkIsWeeklyArticle();
        if (isWeekly) {
          if (weeklyNotice) weeklyNotice.style.display = 'block';
          if (scheduleSec) scheduleSec.style.display = 'none';
          submitBtn.textContent = isPublished ? 'Update in Edition' : 'Publish to Edition';
          submitBtn.style.backgroundColor = '#10b981';
        } else {
          if (weeklyNotice) weeklyNotice.style.display = 'none';
          if (scheduleSec) scheduleSec.style.display = 'block';
          updateButtonMorph();
        }
        if (backdrop) backdrop.style.display = 'block';
        if (drawer) drawer.style.display = 'flex';
      }

      backdrop?.addEventListener('click', () => {
        closeDrawer();
      });

      function updateButtonMorph() {
        if (!datePicker || !timePicker) return;
        const isPublished = getIsPublishedItem();
        const dateVal = datePicker.value || currentIsoDate;
        const timeVal = timePicker.value || `${currentHh}:${currentMm}`;
        const combinedIso = `${dateVal}T${timeVal}`;
        const selectedDate = new Date(combinedIso);
        const currentNow = new Date();
        const isFuture = selectedDate.getTime() > currentNow.getTime() + 60000;

        if (isPublished) {
          submitBtn.textContent = 'Update';
          submitBtn.style.backgroundColor = '#059669';
        } else if (isFuture) {
          submitBtn.textContent = 'Schedule';
          submitBtn.style.backgroundColor = '#4f46e5';
          if (statusText) statusText.textContent = `${dateVal} ${timeVal} WIB`;
        } else {
          submitBtn.textContent = 'Publish';
          submitBtn.style.backgroundColor = '#007cba';
          if (statusText) statusText.textContent = 'Immediately';
        }
      }

      datePicker?.addEventListener('change', () => {
        updateButtonMorph();
        const isPublished = getIsPublishedItem();
        if (!isPublished) syncDateToKeystatic(datePicker.value, timePicker?.value);
      });
      datePicker?.addEventListener('input', () => {
        updateButtonMorph();
        const isPublished = getIsPublishedItem();
        if (!isPublished) syncDateToKeystatic(datePicker.value, timePicker?.value);
      });
      timePicker?.addEventListener('change', () => {
        updateButtonMorph();
        const isPublished = getIsPublishedItem();
        if (!isPublished) syncDateToKeystatic(datePicker?.value, timePicker.value);
      });
      timePicker?.addEventListener('input', () => {
        updateButtonMorph();
        const isPublished = getIsPublishedItem();
        if (!isPublished) syncDateToKeystatic(datePicker?.value, timePicker.value);
      });

      wpTriggerBtn.addEventListener('click', () => {
        if (checkIsDraftChecked()) {
          // Mode Draft: Pastikan hasBeenPublished = false dan simpan langsung ke server
          syncHasBeenPublishedToKeystatic(false);
          setTimeout(() => {
            mainBtn.click();
          }, 50);
          return;
        }
        openDrawer();
      });

      cancelBtn?.addEventListener('click', () => {
        closeDrawer();
      });

      nowBtn?.addEventListener('click', () => {
        const n = new Date();
        const hh = String(n.getHours()).padStart(2, '0');
        const mm = String(n.getMinutes()).padStart(2, '0');
        const dIso = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
        const timeNow = `${hh}:${mm}`;
        if (datePicker) datePicker.value = dIso;
        if (timePicker) timePicker.value = timeNow;
        updateButtonMorph();
        const isPublished = getIsPublishedItem();
        if (!isPublished) syncDateToKeystatic(dIso, timeNow);
      });

      submitBtn?.addEventListener('click', () => {
        closeDrawer();

        const n = new Date();
        const hh = String(n.getHours()).padStart(2, '0');
        const mm = String(n.getMinutes()).padStart(2, '0');
        const todayIso = `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`;
        const timeNow = `${hh}:${mm}`;
        const isPublished = getIsPublishedItem();

        // Tandai bahwa konten resmi diterbitkan
        syncHasBeenPublishedToKeystatic(true);

        if (!isPublished) {
          // Artikel Baru: Terapkan tanggal & jam rilis awal
          const dateVal = datePicker?.value || currentIsoDate;
          const timeVal = timePicker?.value || `${currentHh}:${currentMm}`;
          syncDateToKeystatic(dateVal, timeVal);
        } else {
          // Artikel Lama (Update): HANYA ubah publishDate jika user sengaja mencentang opsi override
          if (overrideCheckbox && overrideCheckbox.checked && datePicker?.value && timePicker?.value) {
            syncDateToKeystatic(datePicker.value, timePicker.value);
          }
          // Selalu perbarui updatedDate & updatedTime (Diperbarui)
          syncUpdatedDateToKeystatic(todayIso, timeNow);
        }

        setTimeout(() => {
          mainBtn.click();
        }, 100);
      });
    }

    // Enhancer untuk Table List View: Label Status & Quick Actions
    function enhanceTableListView() {
      // Pastikan HANYA berjalan di halaman list view koleksi, bukan di form create/edit
      const pathname = window.location.pathname;
      const isCollectionListPage = pathname.includes('/keystatic/collection/') && !pathname.includes('/create') && !pathname.includes('/item/');
      if (!isCollectionListPage) return;

      // Cari elemen tabel Keystatic/Keystar
      const rows = Array.from(document.querySelectorAll('[role="row"], tr')) as HTMLElement[];
      
      rows.forEach((row) => {
        // Abaikan row header kolom
        if (row.querySelector('[role="columnheader"], th')) return;
        
        // Cari seluruh sel dalam baris
        const cells = Array.from(row.querySelectorAll('[role="gridcell"], [role="rowheader"], td')) as HTMLElement[];
        if (cells.length === 0) return;

        // Baca tanggal (YYYY-MM-DD), jam (HH:mm), dan indikator Draft dari teks seluruh baris tabel
        const rowText = cells.map(c => c.textContent || '').join(' ');
        const dateMatch = rowText.match(/\b\d{4}-\d{2}-\d{2}\b/);
        const timeMatch = rowText.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);

        // Deteksi apakah baris ini memiliki flag draft (true / yes / Draft)
        const isDraftRow = cells.some((c) => {
          const text = (c.textContent || '').trim().toLowerCase();
          return text === 'true' || text === 'yes' || text === 'draft';
        }) || rowText.toLowerCase().includes(' draft ') || rowText.toLowerCase().endsWith(' draft');

        let isFuture = false;
        if (dateMatch) {
          const scheduleDateStr = dateMatch[0];
          const scheduleTimeStr = timeMatch ? timeMatch[0] : '00:00';
          const itemDateTime = new Date(`${scheduleDateStr}T${scheduleTimeStr}:00+07:00`);
          const now = new Date();
          isFuture = itemDateTime.getTime() > now.getTime();
        }

        // Target untuk menempelkan status badge (sel pertama yang memuat slug/judul)
        const firstCell = cells[0];
        if (!firstCell) return;

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
          firstCell.appendChild(badge);
        }

        // Update status badge secara reaktif: DRAFT vs SCHEDULED vs PUBLISHED
        if (isDraftRow) {
          badge.textContent = '📝 DRAFT';
          badge.style.backgroundColor = '#f3f4f6';
          badge.style.color = '#4b5563';
          badge.style.border = '1px solid #d1d5db';
        } else if (isFuture) {
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

        // 2. Quick Action Toolbar (View Item)
        const link = row.querySelector('a') as HTMLAnchorElement | null;
        const linkHref = link?.getAttribute('href') || '';
        const itemSlug = linkHref.includes('/item/') ? linkHref.split('/item/')[1] : (firstCell.textContent?.trim().split(' ')[0] || '');

        if (itemSlug && !row.querySelector('.keystatic-row-actions')) {
          const actionWrapper = document.createElement('div');
          actionWrapper.className = 'keystatic-row-actions';
          actionWrapper.style.cssText = 'display:inline-flex; align-items:center; gap:6px; margin-left:auto; padding-left:12px;';

          const isEdition = pathname.includes('editions');
          const viewUrl = isEdition ? `/writings#edisi-${itemSlug}` : `/writings/${itemSlug}`;

          const viewBtn = document.createElement('a');
          viewBtn.href = viewUrl;
          viewBtn.target = '_blank';
          viewBtn.rel = 'noopener noreferrer';
          viewBtn.title = 'Buka & Preview Artikel';
          viewBtn.innerHTML = '↗ View';
          viewBtn.style.cssText = `
            font-size: 11px;
            font-weight: 600;
            padding: 2px 8px;
            border-radius: 6px;
            background: #f4f4f5;
            color: #18181b;
            border: 1px solid #e4e4e7;
            text-decoration: none;
            cursor: pointer;
            transition: all 0.15s ease;
          `;
          viewBtn.addEventListener('click', (e) => e.stopPropagation());

          actionWrapper.appendChild(viewBtn);

          const lastCell = cells[cells.length - 1];
          if (lastCell) {
            lastCell.style.display = 'flex';
            lastCell.style.alignItems = 'center';
            lastCell.style.justifyContent = 'space-between';
            lastCell.appendChild(actionWrapper);
          }
        }
      });
    }

    const interval = setInterval(() => {
      updateFieldCounters();
      hideCentralDatetimeFields();
      setupWordPressPublishPanel();
      enhanceTableListView();
    }, 300);

    return () => clearInterval(interval);
  }, []);

  return <KeystaticOriginal />;
}

export default KeystaticApp;
