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

## 5. Rencana Tahapan Eksekusi & State Implementation

Setiap langkah dalam roadmap wajib dieksekusi dengan protokol keselamatan:
> [!IMPORTANT]
> **MANDATORY CONTEXT7 MCP USAGE**: Setiap developer / AI Agent yang mengeksekusi tahapan di bawah **WAJIB** menggunakan `Context7 MCP` (`resolve-library-id` & `query-docs`) untuk membaca dokumentasi resmi library terkait (Astro, Keystatic Core, React 19, Tailwind, Markdoc, Date-fns/Intl) sebelum menulis kode baru.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  State 1:    │ ──► │  State 2:    │ ──► │  State 3:    │ ──► │  State 4:    │
│  Schema &    │     │  WordPress   │     │  Staging QA  │     │  Production  │
│  Eliminasi   │     │  Pre-Publish │     │  & Sandbox   │     │  Deploy      │
│  Redundansi  │     │  Component   │     │  Verification│     │  (Main Merg) │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

---

### 🔹 State 1: Schema Cleansing & Eliminasi Redundansi (Backend/Data Layer)
- **Tujuan**: Menghapus field manual yang berpotensi human-error dan menyinkronkan seluruh file data.
- **Tugas**:
  1. [x] Hapus field `publishTime` dari `keystatic.config.ts` dan `src/content/config.ts`.
  2. [x] Ganti `fields.date` menjadi `fields.datetime` standar Keystatic dengan regex validasi `YYYY-MM-DDTHH:mm`.
  3. [x] Jadikan `editionNumber` opsional (auto-fallback: `Edisi [D MMMM YYYY]`).
  4. [x] Ganti teks bebas `category` menjadi `fields.select` terkurasi + preset options.
  5. [x] Migrasikan seluruh file `.json` dan `.mdoc` eksisting agar sinkron 100% tanpa missing/obsolete keys.
- **Context7 Query**: `/keystatic/keystatic` ➔ `fields.datetime configuration and collection validation`.

---

### 🔹 State 2: Pembangunan Komponen React Pre-Publish Panel (UI/UX Layer)
- **Tujuan**: Membangun drawer pre-publish modern ala WordPress Gutenberg tanpa mengganggu React DOM context.
- **Tugas**:
  1. [x] Buat komponen modular pre-publish panel berbasis pola referensi `Bearnie Dev` (`Sheet` / `Dialog` / `Popover`) di `KeystaticApp.tsx`.
  2. [x] Implementasikan State Selector:
     - **Publish: Immediately (Now)** ➔ Menyematkan timestamp terkini.
     - **Schedule** ➔ Time Picker visual (Jam, Menit, AM/PM) + Mini Calendar.
  3. [x] Implementasikan **Reactive Button Morphing**: Label tombol berubah otomatis `Publish` ➔ `Schedule…` jika tanggal dipilih di masa depan.
  4. [x] Implementasikan **Parent-Child Weekly Magazine Detection**: Jika artikel bertipe `📖 Mingguan`, sembunyikan time picker dan tampilkan Info Box Edisi Induk.
  5. [x] Hubungkan submit event ke form asli Keystatic secara pasif dan aman.
- **Context7 Query**: `/facebook/react` ➔ `React 19 portal and non-destructive form control injection`.

---

### 🔹 State 3: Pengujian Menyeluruh di Staging (`dev.itsdvvn.my.id`)
- **Tujuan**: Memvalidasi seluruh use case di environment live staging sebelum menyentuh production.
- **Skenario Pengujian (QA Matrix)**:
  - [ ] **Test Case 1 (Publish Now)**: Buat artikel harian ➔ Klik `Publish Now` ➔ Pastikan langsung muncul di `https://dev.itsdvvn.my.id/writings`.
  - [ ] **Test Case 2 (Scheduled Future)**: Jadwalkan artikel 2 jam ke depan ➔ Pastikan artikel **tidak muncul** di frontend dan sitemap sebelum waktunya.
  - [ ] **Test Case 3 (Parent-Child Weekly)**: Buat edisi majalah terjadwal hari Minggu jam 16:00 ➔ Masukkan artikel child ➔ Pastikan artikel child tersembunyi dan baru muncul tepat saat Edisi rilis.
  - [ ] **Test Case 4 (Responsive UI)**: Uji panel pre-publish di layar desktop, tablet, dan smartphone.
  - [ ] **Test Case 5 (SSR Health Check)**: Pastikan HTTP status code selalu `200 OK` di seluruh endpoint.

---

### 🔹 State 4: Production Release & Rollout (`itsdvvn.my.id`)
- **Tujuan**: Merilis fitur yang sudah terbukti stabil ke publik.
- **Tugas**:
  1. Review final bersama User.
  2. Buat Pull Request & Merge branch `feat/schedule-system` ke `main`.
  3. Jalankan automated build dan restart container di `/root/portfolio` VPS.
  4. Smoke test live di `https://itsdvvn.my.id`.


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

---

## 8. 👑 Adopsi "Logika Emas" WordPress Gutenberg Core

Berdasarkan dokumentasi arsitektur WordPress Core Editor (`@wordpress/data` dan Gutenberg Pre-Publish Flow), berikut adalah 4 pilar logika emas yang diadopsi ke dalam sistem kita:

### 1. State Machine & Status Transitions
WordPress tidak menganggap jadwal hanya sebagai string tanggal, melainkan sebuah **State Transition**:
- **`draft`**: Postingan tersimpan di disk, tidak dipublikasikan ke Astro SSR.
- **`future` (Scheduled)**: Postingan memiliki timestamp rilis `publishDate > Now (WIB)`. Di frontend Astro, data ini otomatis di-filter keluar dari query publik dan sitemap.
- **`publish`**: Begitu waktu sistem mencapai atau melewati `publishDate`, status postingan secara otomatis dianggap aktif (`isArticlePublished = true`) tanpa perlu manual build ulang.

### 2. Pre-Publish Panel Isolation (SlotFill Concept)
- **Separation of Concerns**: Lembar drafting utama murni untuk konten (Judul, Deck, Markdoc editor, Gambar).
- **Pre-Flight Check**: Tindakan publikasi diisolasi di dalam drawer/panel pre-publish untuk memvalidasi:
  - *Visibility* (Publik).
  - *Schedule vs Immediately* (Otomatis mengubah label tombol dari `Publish` menjadi `Schedule` jika tanggal dipilih di masa depan).
  - *Parent Edition Inheritance* (Cek apakah artikel terikat dengan Majalah Mingguan).

### 3. Reactive Button Morphing
- Jika tanggal yang dipilih adalah **waktu saat ini atau masa lalu**, tombol aksi utama berlabel **`Publish`** (Warna Biru WordPress `#007cba` / Emerald `#10b981`).
- Jika tanggal yang dipilih adalah **waktu di masa depan**, tombol aksi otomatis bertransformasi menjadi **`Schedule…`** (Warna Biru / Indigo) untuk memberi penegasan visual kepada penulis bahwa artikel dijadwalkan.

---

## 9. 🔌 Inventaris API, Endpoint, dan Skema Data Web Eksisting

Agar implementasi fitur selanjutnya **terintegrasi 100% tanpa risiko HTTP Error 500**, seluruh struktur sistem saat ini dipetakan secara presisi:

### 9.1. Daftar Endpoint API Internal (`src/pages/api/`)

| Endpoint | Method | Fungsi & Payload | Integrasi Sistem |
| :--- | :--- | :--- | :--- |
| **`/api/subscribe`** | `POST` | Menghandle langganan newsletter pembaca via n8n / Database. Body: `{ email: string }`. | Form Subscribe di halaman artikel & footer |
| **`/api/upload-r2`** | `POST` | Direct upload media/gambar ke Cloudflare R2 CDN (`media.itsdvvn.my.id`). | Media uploader custom di CMS |
| **`/api/media-list`** | `GET` | Mengambil daftar file media yang tersimpan di server/R2. | Media Library Picker |
| **`/api/admin-login`** | `POST` | Autentikasi sesi CMS Admin Yudhi. | Login gate `/admin` & `/keystatic` |
| **`/api/admin-logout`** | `POST` | Mengakhiri sesi login Admin. | Logout button di dashboard |

---

### 9.2. Struktur Routing & SSR Rendering (`src/pages/`)

- **`/` (`index.astro`)**: Halaman beranda utama yang menampilkan profil, latest works, dan featured articles (Harian & Edisi Mingguan).
- **`/writings` (`writings/index.astro`)**: Tabbed portal publikasi:
  - Tab 📰 **Harian**: Menampilkan seluruh artikel `reguler` yang sudah rilis (`isArticlePublished = true`).
  - Tab 📖 **Mingguan**: Menampilkan Cover Story, daftar artikel per edisi, dan arsip edisi-edisi terdahulu.
- **`/writings/[slug]` (`writings/[slug].astro`)**: Halaman baca artikel lengkap dengan reader waktu baca, superskrip sitasi interaktif (`[cite: ...]`), dan daftar referensi otomatis.
- **`/thoughts` (`thoughts.astro`)**: Micro-posts / catatan pendek.
- **`/ships` (`ships.astro`)**: Portofolio proyek foto, video, desain, dan web code.
- **`/keystatic/*` (`keystatic.astro`)**: Single Page Application (SPA) Keystar UI Dashboard untuk content editing.
- **`/sitemap.xml` (`sitemap.xml.ts`)**: Auto-generated dynamic SEO sitemap yang **hanya mengindeks konten berstatus published**.

---

### 9.3. Sinkronisasi Skema Data (Keystatic vs Astro Content)

```
[Keystatic CMS Form] ────────► [Filesystem Storage] ────────► [Astro SSR Readers]
keystatic.config.ts           src/content/writings/*.mdoc    src/lib/reader.ts
                              src/content/editions/*.json    src/lib/schedule.ts
```

#### Field-Field Krusial Koleksi `writings`:
- `title` (*Slug*): Maksimal 80 karakter.
- `deck` (*Textarea*): Maksimal 144 karakter (SEO meta description).
- `publicationType` (*Conditional Object*):
  - `reguler`: Standalone / artikel harian.
  - `mingguan`: Memiliki properti `edition` (relationship ke koleksi `editions`), `rubrik` (string), `order` (number), `isCoverStory` (boolean).
- `publishDate` (*Datetime/Date*): Menggunakan format standar ISO `YYYY-MM-DDTHH:mm`.
- `draft` (*Checkbox*): `true` = draf rahasia, `false` = siap tayang.
- `content` (*Markdoc*): Mendukung custom components `ArticleImage`, `YouTubeEmbed`, `InstagramEmbed`, `SpotifyEmbed`, dan `Citation`.

---

### 9.4. 🛡️ Protokol Anti-HTTP 500 (Aturan Emas Keamanan SSR)

1. **Zero Mismatched Keys**:
   - Jika suatu field ditambahkan/dihapus di `keystatic.config.ts`, wajib periksa seluruh file `.json` dan `.mdoc` di `src/content/`. Keystatic runtime akan melempar exception fatal jika menemukan key asing atau tipe data yang tidak sesuai.
2. **Regex Datetime Strictness**:
   - `fields.datetime` hanya menerima format `^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$`. Jangan tambahkan offset string (`+07:00`) langsung ke isi file disk, biarkan helper `schedule.ts` yang menangani offset WIB saat parsing runtime.
---

## 10. 🧹 Audit UI/UX: Eliminasi Redundansi & Human Error

Audit menyeluruh terhadap antarmuka input dan alur kerja editorial Keystatic CMS yang berpotensi menyebabkan redundansi atau kesalahan manusia (*human error*):

### 10.1. Daftar Input Redundant & Rencana Solusi Otomatisasi

| Komponen / Field | Masalah Saat Ini (Human Error Risk) | Solusi Desain Baru (Otomatis & Pintar) |
| :--- | :--- | :--- |
| **`publishTime` (String Teks Manual)** | Penulis harus mengetik manual teks seperti `"16.00 WIB"`. Rawan typo (`16:00`, `16.00`, `jam 4`). | **Dihapus 100%**. Digantikan oleh unified `fields.datetime` dan *Time Picker* visual (AM/PM atau 24h picker). |
| **`editionNumber` (Label Edisi)** | Penulis harus mengetik manual label seperti `"Edisi 9 Agustus 2026"`. Sering lupa atau formatnya tidak konsisten antar edisi. | **Otomatisasi Penuh**. Field dijadikan opsional; jika kosong, sistem otomatis meng-generate label dari tanggal terbit: `Edisi [D MMMM YYYY]`. |
| **`category` (Teks Bebas Manual)** | Input teks biasa menyebabkan typo kategori (e.g. `Skena`, `skena`, `Skena-kenanya`). | **Pilihan Terkurasi (Select / Combobox)** dengan opsi preset utama + opsi kustom jika diperlukan. |
| **Pemisahan `heroImage` vs `heroImageUrl`** | Ada 2 field terpisah (upload lokal vs URL direct CDN/PocketBase), membuat form panjang dan membingungkan. | **Unified Media Input** atau integrasi langsung ke R2 Media Library. |
| **Input Tanggal di Tengah Form Artikel** | Letak input tanggal di tengah halaman mengganggu konsentrasi drafting penulisan. | **Dipindahkan 100% ke WordPress Pre-Publish Panel**. Lembar utama bersih untuk fokus menulis. |
| **`readTime` (Estimasi Waktu Baca)** | Pernah ada field manual waktu baca artikel. | **100% Auto-calculated** secara dinamis dari jumlah kata dalam konten Markdoc menggunakan algoritma standar 200 wpm (kata per menit). |

---

### 10.2. Prinsip "Zero Friction" untuk Penulis
1. **Fokus Menulis**: Penulis hanya mengisi Judul, Deck, dan isi Tulisan. Semua metadata teknis (tanggal rilis, jam, status terbit, slug) ditangani oleh sistem dan panel pre-publish.
2. **Safe Defaults**: Setiap artikel baru otomatis berstatus *Draft* atau *Publish Immediately* jika tombol Publish ditekan.
3. **No Breaking Validations**: Validasi karakter judul (80) dan deck (144) memberikan feedback visual real-time yang ramah tanpa memblokir proses pengetikan draf.





