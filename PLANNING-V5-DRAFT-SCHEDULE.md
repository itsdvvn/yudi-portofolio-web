# PLANNING V5: Perbaikan Logika State Draft, Publish & Schedule di Keystatic CMS & Astro

## 1. Identifikasi Masalah Utama (Root Cause)

### 🔴 Masalah Saat Ini:
1. Di `KeystaticApp.tsx`, penentuan status artikel (`isPublishedItem`) hanya mengandalkan pengecekan apakah URL berada di `/item/` (`isEditItem = pathname.includes('/item/')`) dan `checkIsItemAlreadyPublished()`:
   ```typescript
   const isPublishedItem = isEditItem && checkIsItemAlreadyPublished();
   // Di mana fallback terakhirnya me-return isEditItem (true)
   ```
2. Akibatnya, artikel baru yang disimpan sebagai **Draft** (yang memiliki URL `/item/<slug>` setelah tersimpan pertama kali di CMS) **salah dideteksi sebagai artikel yang sudah pernah dipublish (`isPublishedItem = true`)**.
3. Ketika pengguna **melepas centang Draft (`uncheck draft`)**:
   - Tombol berubah menjadi **"Update"** (hijau), bukan **"Publish…"** (biru).
   - Drawer publish menganggap artikel ini sudah rilis sebelumnya, sehingga saat tombol ditekan, artikel **langsung terbit ke publik** tanpa membuka drawer pemilihan opsi terbit (*Publish Immediately* vs *Schedule Future*).
4. Selain itu, saat artikel pertama kali dibuat sebagai Draft, field `publishDate` di Keystatic schema otomatis memiliki default `defaultValue: { kind: 'today' }`. Sehingga begitu draft dilepas, tanggal hari ini langsung aktif dan langsung tampil di web publik.

---

## 2. Definisi Logika Alur yang Benar (WordPress & Medium Standard)

### Tiga Status Valid untuk Konten:
1. **DRAFT (Simpan Konsep)**:
   - Artikel hanya tersimpan di backend/server (`draft: true`).
   - Tidak tampil di halaman publik manapun (`isArticlePublished = false`).
   - Tombol utama di CMS: **"Save Draft"** (Abu-abu gelap).
   - Jika ditekan: Menyimpan perubahan konten langsung ke server tanpa mengubah status rilis.

2. **DRAFT DILEPAS CENTANGNYA (Unchecked Draft)**:
   - Pengguna siap mempublikasikan artikel yang tadinya draft.
   - Sistem mendeteksi bahwa artikel ini **BELUM PERNAH DIPUBLIKASIKAN KE PUBLIK SECARA RESMI**.
   - Tombol utama di CMS berubah menjadi **"Publish…"** (Biru).
   - Saat diklik, **WAJIB MEMBUKA DRAWER PUBLISH (Pre-Publish Panel)**:
     - Memberikan opsi: **Publish Immediately (Terbitkan Sekarang)** ATAU **Schedule (Jadwalkan di masa depan)**.
     - Tombol berubah dinamis menjadi **Publish** atau **Schedule**.

3. **PUBLISHED (Sudah Pernah Terbit)**:
   - Artikel sudah pernah melalui proses Publish/Schedule dan tayang ke publik (`draft: false` dan `hasBeenPublished = true`).
   - Tombol utama di CMS: **"Update"** (Hijau).
   - Jika diedit dan disimpan: Menyimpan revisi konten dan memperbarui catatan waktu revisi (`updatedDate` & `updatedTime`) tanpa mengubah tanggal rilis asli.
   - Jika pengguna ingin mengubah status published menjadi draft kembali: Cukup centang `draft: true` ➔ tombol berubah menjadi **"Save Draft"** dan artikel otomatis ditarik dari publik ke server.

---

## 3. Rencana Perubahan Teknis

### A. Perubahan Skema Keystatic (`keystatic.config.ts` & Content):
- Menambahkan field flag internal (hidden/managed): `hasBeenPublished: fields.checkbox({ label: 'Sudah Pernah Dipublish', defaultValue: false })` ATAU melacak berdasarkan kombinasi `draft: false` dan `publishedAt` yang terekam saat pertama kali melalui workflow Publish Drawer.

### B. Perbaikan Deteksi Status di `KeystaticApp.tsx`:
- Memperbaiki `checkIsItemAlreadyPublished()`:
  - Artikel bertatus `draft: true` **BUKAN published item**.
  - Jika `draft` di-uncheck, sistem memeriksa apakah artikel memiliki `hasBeenPublished: true`.
  - Jika belum (`hasBeenPublished === false`), statusnya adalah **Unpublished Draft ➔ Tampilkan tombol "Publish…" (Biru)** yang akan membuka drawer Gutenberg untuk memilih:
    1. **Publish Sekarang (Immediately)**: Set `publishDate = hari ini`, `publishTime = jam sekarang`, set `hasBeenPublished = true`, simpan.
    2. **Schedule**: Set `publishDate = tanggal masa depan`, `publishTime = jam masa depan`, set `hasBeenPublished = true`, simpan.

### C. Menjaga Kompatibilitas `src/lib/schedule.ts`:
- Logika rilis publik di frontend Astro:
  ```typescript
  export function isArticlePublished(article, parentEdition): boolean {
    if (!article) return false;
    if (article.draft) return false; // DRAFT SELALU HIDDEN
    // Cek jadwal rilis
    const releaseDate = parsePublishDateTime(article.publishDate, article.publishTime);
    return releaseDate.getTime() <= Date.now();
  }
  ```

---

## 4. Rencana Pengujian & Staging (Zero Risk):
1. Kerjakan di branch **`develop-v5`**.
2. Deploy ke lingkungan **Staging DEV (`dev.itsdvvn.my.id`)** menggunakan fast deploy.
3. Jalankan skenario uji:
   - **Skenario 1**: Buat artikel baru, centang Draft ➔ Klik "Save Draft" ➔ Pastikan tidak muncul di web dev.
   - **Skenario 2**: Buka kembali draft tersebut, lepas centang Draft ➔ Tombol harus menjadi **"Publish…"** (Biru).
   - **Skenario 3**: Klik "Publish…" ➔ Drawer harus terbuka. Pilih tanggal besok (Schedule) ➔ Klik "Schedule" ➔ Pastikan artikel tetap tidak muncul di web karena belum waktunya.
   - **Skenario 4**: Buka drawer lagi, pilih "Set to Now" ➔ Klik "Publish" ➔ Artikel resmi tampil di web.
   - **Skenario 5**: Buka artikel yang sudah rilis, centang Draft ➔ Simpan ➔ Artikel langsung ditarik dari web dan kembali menjadi Draft di server.
