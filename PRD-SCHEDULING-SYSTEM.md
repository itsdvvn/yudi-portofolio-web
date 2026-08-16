# 📄 Product Requirement Document (PRD)
## Fitur: Smart Scheduling & WordPress-Style Publishing Workflow

**Versi Dokumen:** 1.0.0  
**Status:** In Development (Branch: `feat/schedule-system`)  
**Target Environment:** Staging (`dev.itsdvvn.my.id`) ➔ Production (`itsdvvn.my.id`)  
**Penulis:** Antigravity AI & Yudhi

---

## 1. Executive Summary & Vision

Sistem Editorial Website Yudhi (`itsdvvn.my.id`) membutuhkan alur penerbitan (*publishing workflow*) yang terpadu, intuitif, dan fleksibel. Selama ini, penerbitan konten menghadapi dua kendala utama:
1. **Pemisahan field tanggal dan jam manual** yang kaku dan memperbesar risiko human error.
2. **Keterikatan antara liputan harian dan laporan mingguan (majalah)**, di mana artikel majalah tidak boleh terbit mendahului edisi induknya.

PRD ini mendefinisikan standar teknis, arsitektur data, dan pengalaman pengguna (UI/UX) ala **WordPress Gutenberg Pre-Publish Panel** yang disesuaikan dengan Keystatic CMS dan Astro SSR.

---

## 2. User Persona & Use Cases

### User Persona
- **Yudhi (Editor-in-Chief & Writer)**: Menulis artikel harian secara cepat atau menyiapkan laporan investigasi edisi mingguan yang terbit terjadwal secara berkala (misal setiap hari Minggu jam 16:00 WIB).

### Primary Use Cases
1. **UC-01 (Publish Now - Harian)**: Penulis selesai menulis artikel reguler, menekan tombol `Publish`, memilih opsi *"Immediately (Now)"*, dan artikel langsung tayang di detik itu juga.
2. **UC-02 (Schedule Publication - Harian)**: Penulis menyiapkan artikel hari Jumat untuk tayang otomatis pada hari Senin jam 09:00 WIB.
3. **UC-03 (Parent-Child Publishing - Edisi Mingguan)**: Penulis menyusun beberapa artikel yang dikelompokkan ke dalam satu Edisi Majalah (Parent). Status terbit seluruh artikel *child* ditentukan 100% oleh jadwal tayang Edisi Mingguan tersebut.
4. **UC-04 (Draft Mode)**: Penulis menyimpan draf tulisan yang belum siap tayang tanpa terpengaruh oleh tanggal rilis.

---

## 3. Arsitektur & Logika Sistem (Backend & Content Schema)

### 3.1. Format Waktu & Standar Skema (Anti-500 Error Standard)
- Menggunakan `fields.datetime` standar Keystatic pada koleksi `writings` dan `editions`.
- Format data yang disimpan di disk (Markdown/JSON):
  - **Regex Standar**: `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$` (Contoh: `2026-08-16T14:00`).
  - **Zona Waktu Default**: **WIB (Western Indonesia Time / UTC+7)**.
- **Auto-generated Edition Label**:
  - Jika field `editionNumber` pada Edisi dikosongkan, sistem otomatis membentuk label: `"Edisi [D MMMM YYYY]"` berdasarkan tanggal rilis.

### 3.2. Matriks Keputusan Rilis (`isArticlePublished`)

| Tipe Artikel | Status Parent Edition | Tanggal/Jam Artikel vs Waktu Saat Ini (WIB) | Status Frontend |
| :--- | :--- | :--- | :--- |
| **Harian (Reguler)** | N/A | `publishDate <= Now` | **TAYANG (Public)** |
| **Harian (Reguler)** | N/A | `publishDate > Now` (Terjadwal) | **DISEMBUNYIKAN (Scheduled)** |
| **Harian (Reguler)** | N/A | `draft: true` | **DISEMBUNYIKAN (Draft)** |
| **Mingguan (Child)** | Belum Rilis / Draft | Kapanpun | **DISEMBUNYIKAN (Menunggu Edisi Induk)** |
| **Mingguan (Child)** | Sudah Rilis (`isEditionPublished = true`) | N/A | **TAYANG (Public)** |

---

## 4. Spesifikasi UI/UX (WordPress Gutenberg Style Pre-Publish)

### 4.1. Workspace Drafting Bersih (*Clean Writing Canvas*)
- Bidang input tanggal/jam tidak lagi diletakkan di tengah lembar ketik artikel agar tidak mendistraksi penulis.
- Di pojok kanan atas hanya ada:
  - Tombol **`Save Draft`** (Abu-abu / Netral).
  - Tombol **`Publish…`** (Biru WordPress `#007cba` / Emerald `#10b981`).

### 4.2. Pre-Publish Slide-over Panel (Drawer Kanan)
Ketika tombol `Publish…` diklik, muncul panel drawer samping kanan dengan alur:

```
┌────────────────────────────────────────────────────────────┐
│  [ Cancel ]                                 [ Publish ]    │
├────────────────────────────────────────────────────────────┤
│  Are you ready to publish?                                 │
│  Double-check your settings before publishing.            │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│  Visibility:                                       Public  │
│  ────────────────────────────────────────────────────────  │
│                                                            │
│  ▼ Publish: Immediately (Now)                [ Edit / ▾ ]  │
│    ┌────────────────────────────────────────────────────┐  │
│    │  TIME: [ 03 : 21 ]  [ AM | PM ]                    │  │
│    │  DATE: [ 16 ] [ August ▾ ] [ 2026 ]                │  │
│    │                                                    │  │
│    │  [ Mini Interactive Calendar ]                     │  │
│    │  Mon  Tue  Wed  Thu  Fri  Sat  Sun                 │  │
│    │        1    2    3    4    5    6                  │  │
│    │   7    8    9   10   11   12   13                  │  │
│    │  14   15  (16)  17   18   19   20                  │  │
│    │                                                    │  │
│    │  [ Set to Now ]                    Zona Waktu: WIB │  │
│    └────────────────────────────────────────────────────┘  │
│                                                            │
│  ────────────────────────────────────────────────────────  │
│  📖 Tipe Publikasi: 📰 Harian (Reguler)                    │
└────────────────────────────────────────────────────────────┘
```

### 4.3. Penanganan Khusus Artikel Majalah Mingguan di Modal
- Jika artikel di-set sebagai `📖 Mingguan`:
  - Accordion waktu ditutup dan digantikan oleh Info Box Hijau:
    > *"📖 **Bagian dari Majalah Mingguan**: Jadwal tayang artikel ini otomatis diwarisi dari Edisi Induk (`[Judul Edisi]`)."*
  - Tombol aksi berubah menjadi **`Save to Edition`**.

---

## 5. Rencana Tahapan Eksekusi (Roadmap)

### Fase 1: Validasi Skema & Engine Waktu (Core Engine)
- [x] Sinkronisasi data content dengan regex `YYYY-MM-DDTHH:mm`.
- [x] Pembuatan helper `src/lib/schedule.ts` berbasis offset WIB (UTC+7).
- [x] Filter otomatis di SSR `writings/index.astro`, `writings/[slug].astro`, dan `sitemap.xml.ts`.

### Fase 2: Pembangunan Komponen UI Pre-Publish Panel (React Component)
- [ ] Buat komponen React mandiri `src/components/cms/WordPressPublishPanel.tsx`.
- [ ] Integrasikan Time Picker (Jam, Menit, AM/PM) & Date Picker interaktif.
- [ ] Integrasikan state sinkronisasi ke form Keystatic tanpa merusak React Error Boundary.

### Fase 3: Pengujian di Staging (`dev.itsdvvn.my.id`)
- [ ] Uji kasus: Publish Now (Harian).
- [ ] Uji kasus: Schedule Masa Depan (Harian) ➔ Pastikan artikel tidak muncul di frontend sebelum jamnya.
- [ ] Uji kasus: Artikel Mingguan ➔ Pastikan otomatis terbit saat Edisi Induk terbit.
- [ ] Uji responsivitas UI di layar desktop & mobile.

### Fase 4: Merge & Deployment ke Production (`itsdvvn.my.id`)
- [ ] Review akhir bersama User.
- [ ] Merge branch `feat/schedule-system` ke `main`.
- [ ] Automated deploy ke container produksi di VPS.

---

## 6. Verification & Quality Gates (DoD)

1. **No SSR 500 Exceptions**: Seluruh route Astro dan Keystatic Admin harus mengembalikan status `200 OK`.
2. **Zero Browser Alert**: Tidak boleh ada dialog `alert()` bawaan browser.
3. **Draft Safety**: Artikel berstatus draft atau jadwal masa depan tidak boleh bocor di `sitemap.xml` atau halaman publik.
4. **Clean Codebase**: Tidak ada manipulasi DOM destruktif yang menyebabkan blank white screen di Keystatic.

---

## 7. Referensi UI & Resource Komponen
- **Astro Component Library & Patterns**: [Bearnie Docs (https://bearnie.dev/docs/)](https://bearnie.dev/docs/)  
  *Gunakan referensi komponen Bearnie Dev (seperti `Sheet`, `Popover`, `Dialog`, `Calendar/DatePicker`, `Button Group`, dan `Accordion`) untuk panduan struktur markup, aksesibilitas (a11y), dan styling minimalis yang presisi.*
- **Publishing Workflow Inspiration**: WordPress Gutenberg Pre-Publish Sidebar Panel.
- **Agent Token Efficiency & Minimalist Engineering**: [Ponytail Architecture (https://github.com/DietrichGebert/ponytail)](https://github.com/DietrichGebert/ponytail)  
  *Prinsip "The best code is the code you never wrote" & "Laziest Senior Dev":*
  - *Utamakan komponen native dan minimalis tanpa bloating dependency.*
  - *Gunakan chunking terfokus dan modularitas tinggi untuk menghemat konsumsi token context AI saat maintenance dan pengembangan fitur selanjutnya.*


