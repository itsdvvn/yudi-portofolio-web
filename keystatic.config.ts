import { config, fields, collection, singleton } from '@keystatic/core';
import { block, inline } from '@keystatic/core/content-components';

export default config({
  storage: {
    kind: 'local',
  },
  singletons: {
    site: singleton({
      label: 'Pengaturan Web & SEO',
      path: 'src/content/site/index',
      format: { data: 'json' },
      schema: {
        siteTitle: fields.text({
          label: 'Meta Title Web (SEO & Open Graph)',
          defaultValue: 'Wahyudi Setiawan (dvvn) – Multimedia Creator & Visual Storyteller',
        }),
        siteDescription: fields.text({
          label: 'Meta Deskripsi Web (SEO & Link Preview)',
          multiline: true,
          defaultValue: 'Personal space of Wahyudi Setiawan (dvvn). Multimedia creator focused on visual storytelling, photography, cinematic video, and creative web exploration.',
        }),
      },
    }),
    about: singleton({
      label: 'Resume / CV & About Me',
      path: 'src/content/about/index',
      format: { data: 'json' },
      schema: {
        showInNavbar: fields.checkbox({
          label: 'Tampilkan Menu "about me" di Navbar Publik',
          description: 'Centang jika ingin memunculkan menu About Me / Resume di navigasi website',
          defaultValue: false,
        }),
        avatarImage: fields.image({
          label: 'Avatar / Profile Photo (Pilih / Upload File)',
          directory: 'public/images/profile',
          publicPath: '/media/profile/',
        }),
        avatarUrl: fields.text({
          label: 'Atau Avatar R2 CDN URL (Opsional: https://media.itsdvvn.my.id/...)',
        }),
        headline: fields.text({
          label: 'Greeting / Headline (H1)',
          defaultValue: "Halo, saya Yudi 🍍",
        }),
        bio: fields.text({
          label: 'Bio / Intro Paragraph',
          multiline: true,
          defaultValue: "Saya seorang multimedia creator dengan fokus pada visual storytelling (fotografi, video) dan teknologi web.",
        }),
        roles: fields.array(
          fields.object({
            title: fields.text({ label: 'Peran / Role (e.g. Videografer / Fotografer)' }),
            description: fields.text({ label: 'Deskripsi Peran', multiline: true }),
          }),
          {
            label: 'Dikenal Sebagai / Roles List (Bulleted Highlights)',
            itemLabel: (props) => props.fields.title.value || 'Role Item',
          }
        ),
        education: fields.array(
          fields.object({
            degree: fields.text({ label: 'Gelar / Jurusan (e.g. S1 Desain Komunikasi Visual)' }),
            institution: fields.text({ label: 'Institusi / Universitas' }),
            year: fields.text({ label: 'Tahun / Periode (Opsional jika diisi manual: e.g. 2019 - 2023)' }),
            startYear: fields.text({ label: 'Tahun Mulai (e.g. 2023)' }),
            endYear: fields.text({ label: 'Tahun Selesai (e.g. 2027)' }),
            current: fields.checkbox({ label: 'Masih Berlangsung / Sampai Sekarang (Present)', defaultValue: false }),
          }),
          {
            label: '🎓 Pendidikan',
            itemLabel: (props) => props.fields.degree.value || 'Pendidikan',
          }
        ),
        educationPhoto: fields.image({
          label: 'Foto Momen Wisuda / Pendidikan (Pilih / Upload File)',
          directory: 'public/images/education',
          publicPath: '/media/education/',
        }),
        educationPhotoUrl: fields.text({
          label: 'Atau Foto Wisuda R2 CDN URL (Opsional: https://media.itsdvvn.my.id/...)',
        }),
        experience: fields.array(
          fields.object({
            position: fields.text({ label: 'Posisi & Tempat (e.g. Creative Director, Studio Media)' }),
            period: fields.text({ label: 'Periode (Opsional jika diisi manual: e.g. 2023 – now)' }),
            startYear: fields.text({ label: 'Tahun / Bulan Mulai (e.g. 2023)' }),
            endYear: fields.text({ label: 'Tahun / Bulan Selesai (e.g. 2025)' }),
            current: fields.checkbox({ label: 'Masih Bekerja di Sini / Sampai Sekarang (Present)', defaultValue: false }),
            description: fields.text({ label: 'Deskripsi Pengalaman / Tanggung Jawab', multiline: true }),
          }),
          {
            label: '🏢 Pengalaman',
            itemLabel: (props) => props.fields.position.value || 'Pengalaman',
          }
        ),
        awards: fields.array(
          fields.object({
            title: fields.text({ label: 'Nama Penghargaan' }),
            year: fields.text({ label: 'Tahun / Penyelenggara' }),
          }),
          {
            label: '🏆 Penghargaan',
            itemLabel: (props) => props.fields.title.value || 'Penghargaan',
          }
        ),
        recentActivities: fields.array(
          fields.object({
            title: fields.text({ label: 'Nama Kegiatan / Event' }),
            locationDate: fields.text({ label: 'Lokasi & Tanggal (e.g. Jakarta, 12 Oktober 2025)' }),
          }),
          {
            label: '📣 Aktivitas Terbaru (Seminar / Workshop / Pameran)',
            itemLabel: (props) => props.fields.title.value || 'Aktivitas',
          }
        ),
      },
    }),
    footer: singleton({
      label: 'Footer & Media Sosial Web',
      path: 'src/content/footer/index',
      format: { data: 'json' },
      schema: {
        youtube: fields.url({ label: 'YouTube URL' }),
        instagram: fields.url({ label: 'Instagram URL' }),
        tiktok: fields.url({ label: 'TikTok URL' }),
        discord: fields.url({ label: 'Discord URL' }),
        github: fields.url({ label: 'GitHub URL' }),
        xTwitter: fields.url({ label: 'X / Twitter URL' }),
        email: fields.text({ label: 'Email Address' }),
      },
    }),
  },
  collections: {
    authors: collection({
      label: 'Penulis (Authors)',
      slugField: 'name',
      path: 'src/content/authors/*',
      format: { data: 'json' },
      columns: ['name', 'isDefault'],
      schema: {
        name: fields.slug({
          name: {
            label: 'Nama Lengkap / Nama Pena Penulis',
            description: 'Nama yang akan tampil pada kartu profil dan arsip tulisan',
          },
        }),
        bio: fields.text({
          label: 'Bio / Deskripsi Profil Penulis (Wajib)',
          description: 'Keterangan ringkas tentang profil, keahlian, atau latar belakang penulis',
          multiline: true,
          validation: { isRequired: true },
        }),
        avatar: fields.image({
          label: 'Foto Profil / Avatar (Pilih / Upload File)',
          directory: 'public/images/authors',
          publicPath: '/media/authors/',
        }),
        avatarUrl: fields.text({
          label: 'Atau Avatar CDN / R2 URL (Opsional: https://media.itsdvvn.my.id/...)',
        }),
        instagram: fields.text({ label: 'Username / URL Instagram (Opsional)' }),
        xTwitter: fields.text({ label: 'Username / URL X / Twitter (Opsional)' }),
        website: fields.text({ label: 'Website Pribadi (Opsional)' }),
        isDefault: fields.checkbox({
          label: 'Jadikan Penulis Utama / Default',
          description: 'Otomatis digunakan jika artikel tidak memilih penulis tertentu',
          defaultValue: false,
        }),
      },
    }),
    tags: collection({
      label: 'Tags / Topik Artikel',
      slugField: 'name',
      path: 'src/content/tags/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({
          name: {
            label: 'Nama Tag (e.g. Politik, AI, Film, Budaya, Musik)',
            description: 'Tulis nama tag baru yang ingin Anda tambahkan',
          },
        }),
        description: fields.text({
          label: 'Deskripsi Tag (Opsional)',
          description: 'Keterangan singkat tentang topik tag ini',
          multiline: true,
        }),
      },
    }),
    rubrics: collection({
      label: 'Rubrik & Kategori',
      slugField: 'name',
      path: 'src/content/rubrics/*',
      format: { data: 'json' },
      schema: {
        name: fields.slug({
          name: {
            label: 'Nama Rubrik / Kategori (e.g. Skena-kenanya, Opini, Teknologi, Musik)',
            description: 'Tulis nama rubrik baru yang ingin Anda tambahkan',
          },
        }),
        description: fields.text({
          label: 'Deskripsi Rubrik (Opsional)',
          description: 'Keterangan singkat tentang topik rubrik ini',
          multiline: true,
        }),
      },
    }),
    editions: collection({
      label: 'Edisi Mingguan (Majalah)',
      slugField: 'title',
      path: 'src/content/editions/*',
      format: { data: 'json' },
      columns: ['title', 'publishDate', 'publishTime'],
      schema: {
        title: fields.slug({ 
          name: { 
            label: 'Judul Topik Utama / Headline Edisi (e.g. Korek-korek Kocek Bokek)' 
          } 
        }),
        editionNumber: fields.text({
          label: 'Label Edisi (Opsional: e.g. Edisi 9 Agustus 2026)',
          description: 'Kosongkan jika ingin label otomatis terbuat dari tanggal rilis.',
        }),
        publishDate: fields.date({ 
          label: 'Jadwal Rilis Majalah (WIB)', 
          defaultValue: { kind: 'today' },
          validation: { isRequired: true }
        }),
        publishTime: fields.text({
          label: 'Jam Rilis Majalah (WIB, format: HH:mm)',
          description: 'Format 24 jam (misal 06:00, 19:30). Sesuai Waktu Indonesia Barat (WIB).',
          defaultValue: () => {
            const now = new Date();
            const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
            const wib = new Date(utc + (3600000 * 7));
            const hh = String(wib.getHours()).padStart(2, '0');
            const mm = String(wib.getMinutes()).padStart(2, '0');
            return `${hh}:${mm}`;
          },
          validation: {
            match: {
              regex: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/,
              explanation: 'Format harus berupa jam valid 24 jam: HH:mm (contoh: 07:00 atau 23:30)'
            }
          }
        }),
        coverImage: fields.image({
          label: 'Cover Gambar Edisi',
          directory: 'public/media/editions',
          publicPath: '/media/editions',
        }),
        coverImageUrl: fields.text({
          label: 'Atau URL Cover CDN / R2 (Direct Link: https://media.itsdvvn.my.id/...)',
        }),
        summary: fields.text({
          label: 'Ringkasan / Intro Isu Pekan Ini',
          multiline: true,
        }),
        featured: fields.checkbox({
          label: 'Jadikan Edisi Utama Terkini (Active Edition)',
          defaultValue: true,
        }),
        draft: fields.checkbox({
          label: 'Draft (Sembunyikan dari publik)',
          defaultValue: false,
        }),
      },
    }),
    writings: collection({
      label: 'Writings (Artikel Harian & Mingguan)',
      slugField: 'title',
      path: 'src/content/writings/*',
      format: { contentField: 'content' },
      columns: ['title', 'category', 'publishDate', 'publishTime'],
      schema: {
        title: fields.slug({ 
          name: { 
            label: 'Headline / Judul Artikel (Maksimal 80 karakter)',
            description: 'Tulis judul artikel (maksimal 80 karakter)'
          },
        }),
        publicationType: fields.conditional(
          fields.select({
            label: 'Tipe Publikasi',
            description: 'Pilih apakah artikel harian/reguler atau bagian dari Majalah Edisi Mingguan',
            options: [
              { label: '📰 Harian (Reguler / Standalone)', value: 'reguler' },
              { label: '📖 Mingguan (Majalah Edisi Khusus)', value: 'mingguan' },
            ],
            defaultValue: 'reguler',
          }),
          {
            reguler: fields.object({}),
            mingguan: fields.object({
              edition: fields.relationship({
                label: 'Pilih Edisi Mingguan',
                description: 'Hubungkan artikel ini ke Edisi Majalah yang bersangkutan',
                collection: 'editions',
              }),
              rubrik: fields.relationship({
                label: 'Rubrik Majalah',
                description: 'Pilih Rubrik Edisi Majalah',
                collection: 'rubrics',
              }),
              order: fields.integer({
                label: 'Nomor Urutan Artikel dalam Edisi (e.g. 1 untuk Laporan Utama, 2, 3, dst)',
                defaultValue: 1,
              }),
              isCoverStory: fields.checkbox({
                label: '⭐ Laporan Utama (Cover Story) Edisi Ini',
                defaultValue: false,
              }),
            }),
          }
        ),
        category: fields.relationship({ 
          label: 'Kategori / Rubrik Artikel', 
          description: 'Pilih kategori atau rubrik artikel ini dari daftar yang tersedia',
          collection: 'rubrics',
        }),
        deck: fields.text({ 
          label: 'Deck / Deskripsi Artikel (Maksimal 144 karakter)', 
          description: 'Ringkasan singkat subheadline / meta deskripsi artikel (maks. 144 karakter)',
          multiline: true,
          validation: {
            length: {
              max: 144,
            },
          },
        }),
        publishDate: fields.date({ 
          label: 'Tanggal Rilis Artikel', 
          defaultValue: { kind: 'today' } 
        }),
        publishTime: fields.text({
          label: 'Jam Rilis Artikel (WIB, format: HH:mm)',
          defaultValue: () => {
            const n = new Date();
            return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
          },
        }),
        updatedDate: fields.date({
          label: 'Tanggal Terakhir Diperbarui (Opsional / Otomatis)',
          description: 'Akan terisi otomatis saat Anda menekan tombol Update revisi artikel',
        }),
        updatedTime: fields.text({
          label: 'Jam Terakhir Diperbarui (WIB, format: HH:mm)',
          description: 'Format 24 jam (misal 14:30)',
        }),
        heroImage: fields.image({
          label: 'Hero / Featured Image (Pilih / Upload File)',
          directory: 'public/images/writings',
          publicPath: '/media/writings/',
        }),
        heroImageUrl: fields.text({
          label: 'Hero Image URL (PocketBase / CDN / R2: https://pb.itsdvvn.my.id/api/files/...)',
        }),
        imageCaption: fields.text({ label: 'Image Caption' }),
        photoCredit: fields.text({ label: 'Photo Credit' }),
        tags: fields.array(
          fields.relationship({
            label: 'Pilih Tag',
            collection: 'tags',
          }),
          {
            label: 'Tags Artikel',
            itemLabel: (props) => props.value || 'Pilih Tag...',
          }
        ),
        author: fields.relationship({
          label: '✍️ Pilih Penulis (Author)',
          collection: 'authors',
          description: 'Pilih profil penulis untuk tulisan ini (jika dikosongkan, akan menggunakan profil default)',
        }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        isLocked: fields.checkbox({
          label: '🔒 Kunci Artikel Ini (Password Protected)',
          description: 'Aktifkan jika artikel ini bersifat privat dan pembaca wajib memasukkan kata sandi',
          defaultValue: false,
        }),
        password: fields.text({
          label: 'Kata Sandi Pembuka Artikel',
          description: 'Password untuk membuka artikel (diperlukan jika artikel dikunci)',
        }),
        passwordClue: fields.text({
          label: 'Clue / Petunjuk Password',
          description: 'Petunjuk ramah untuk pembaca (misal: "Makanan kesukaan", "Nama panggilan", dll.)',
        }),
        content: fields.markdoc({
          label: 'Article Body Content',
          options: {
            image: {
              directory: 'public/images/body',
              publicPath: '/media/body/',
            },
          },
          components: {
            ArticleImage: block({
              label: '📸 Foto Artikel (Keterangan & Kredit Foto)',
              schema: {
                image: fields.image({
                  label: 'Pilih / Unggah Foto',
                  directory: 'public/images/body',
                  publicPath: '/media/body/',
                }),
                caption: fields.text({
                  label: 'Keterangan Foto (Caption)',
                  multiline: true,
                }),
                credit: fields.text({
                  label: 'Kredit Foto / Sumber (contoh: Antara/HO-Pemkab Cirebon)',
                }),
              },
            }),
            YouTubeEmbed: block({
              label: '▶️ YouTube Video Embed',
              schema: {
                url: fields.text({
                  label: 'YouTube URL / Video ID',
                  description: 'Contoh: https://www.youtube.com/watch?v=dQw4w9WgXcQ atau dQw4w9WgXcQ',
                }),
                caption: fields.text({
                  label: 'Keterangan Video (Opsional)',
                }),
              },
            }),
            InstagramEmbed: block({
              label: '📸 Instagram Post / Reel Embed',
              schema: {
                url: fields.text({
                  label: 'Instagram Post / Reel URL',
                  description: 'Contoh: https://www.instagram.com/p/C-xyz123/ atau https://www.instagram.com/reel/xyz123/',
                }),
                caption: fields.text({
                  label: 'Keterangan Post (Opsional)',
                }),
              },
            }),
            SpotifyEmbed: block({
              label: '🎵 Spotify Track / Album / Playlist Embed',
              schema: {
                url: fields.text({
                  label: 'Spotify URL / URI',
                  description: 'Contoh: https://open.spotify.com/track/... atau https://open.spotify.com/album/... atau https://open.spotify.com/playlist/...',
                }),
                caption: fields.text({
                  label: 'Keterangan Lagu / Playlist (Opsional)',
                }),
              },
            }),
            Citation: inline({
              label: '📌 Sitasi / Catatan Kaki (Superskrip [1])',
              schema: {
                id: fields.text({
                  label: 'Nomor / Indeks Sitasi (contoh: 1, 2, 3)',
                  defaultValue: '1',
                }),
                source: fields.text({
                  label: 'Judul Sumber / Referensi (e.g. Laporan Tahunan Kemenkeu 2026)',
                }),
                author: fields.text({
                  label: 'Penulis / Lembaga / Media (e.g. Los Panturas Ent. / BPS)',
                }),
                url: fields.url({
                  label: 'Tautan / Link Sumber (Opsional: https://...)',
                }),
                year: fields.text({
                  label: 'Tahun / Tanggal (Opsional: e.g. 2026)',
                }),
                note: fields.text({
                  label: 'Kutipan Singkat / Catatan Tambahan (Opsional)',
                  multiline: true,
                }),
              },
            }),
          },
        }),
      },
    }),
    thoughts: collection({
      label: 'Thoughts (Micro-Posts)',
      slugField: 'id',
      path: 'src/content/thoughts/*',
      format: { contentField: 'content' },
      columns: ['publishDate', 'pinned'],
      schema: {
        id: fields.slug({ name: { label: 'Short ID / Title' } }),
        pinned: fields.checkbox({
          label: '📌 Sematkan Postingan Ini (Pin to Top)',
          defaultValue: false,
        }),
        publishDate: fields.date({ label: 'Date', defaultValue: { kind: 'today' } }),
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'Tag',
        }),
        content: fields.markdoc({
          label: 'Thought Content',
        }),
      },
    }),
    ships: collection({
      label: 'Ships & Works (Portfolio)',
      slugField: 'title',
      path: 'src/content/ships/*',
      format: { contentField: 'content' },
      columns: ['title', 'category', 'year', 'featured'],
      schema: {
        title: fields.slug({ name: { label: 'Project / Artwork Title' } }),
        category: fields.select({
          label: 'Pilih Kategori (Select Existing)',
          description: 'Pilih dari kategori yang sering digunakan, atau pilih "Lainnya / Custom" untuk membuat kategori baru',
          options: [
            { label: '📷 Photography', value: 'Photography' },
            { label: '🎥 Videography', value: 'Videography' },
            { label: '🎨 Design & Visual Arts', value: 'Design' },
            { label: '💻 Code & Web Development', value: 'Code' },
            { label: '🌐 Multimedia', value: 'Multimedia' },
            { label: '✍️ Writing & Editorial', value: 'Writing' },
            { label: '✨ Lainnya / Buat Kategori Baru (Custom)', value: 'Custom' },
          ],
          defaultValue: 'Photography',
        }),
        customCategory: fields.text({
          label: 'Nama Kategori Baru (Hanya isi jika memilih "Lainnya / Custom")',
          description: 'Contoh: 3D Art, Motion Graphics, Mobile App, dll.',
        }),
        description: fields.text({ label: 'Short Description / Story (Executive Summary)', multiline: true }),
        client: fields.text({ label: 'Client / Event / Publisher (Opsional, e.g. PT Multimedia / Personal Work)' }),
        role: fields.text({ label: 'Peran / Role (e.g. Director of Photography / Lead Developer / Designer)' }),
        coverImage: fields.image({
          label: 'Cover / Thumbnail Image (Pilih / Upload File)',
          directory: 'public/images/ships',
          publicPath: '/media/ships/',
        }),
        coverImageUrl: fields.text({
          label: 'Atau Cover R2 CDN URL (Opsional: https://media.itsdvvn.my.id/...)',
        }),
        videoUrl: fields.url({ label: 'Featured Video URL (YouTube / Vimeo / Direct link)' }),
        link: fields.url({ label: 'Live Link / Portfolio URL (Behance, Instagram, Live Site, Demo)' }),
        github: fields.url({ label: 'GitHub Repo (if code project)' }),
        tools: fields.array(fields.text({ label: 'Tool / Gear' }), {
          label: 'Tools & Gear (e.g. Sony A7IV, Premiere Pro, Figma, Astro, Tailwind)',
          itemLabel: (props) => props.value || 'Tool',
        }),
        year: fields.text({ label: 'Year', defaultValue: '2025' }),
        featured: fields.checkbox({ label: 'Featured on Homepage', defaultValue: false }),
        publishDate: fields.date({ label: 'Publish Date', defaultValue: { kind: 'today' } }),
        updatedDate: fields.date({ label: 'Updated Date (Terakhir Diperbarui)' }),
        content: fields.markdoc({
          label: 'Project Case Study / Behind the Scenes / Detail Cerita Lengkap',
          options: {
            image: {
              directory: 'public/images/ships/body',
              publicPath: '/media/ships/body/',
            },
          },
          components: {
            ProjectGallery: block({
              label: '🖼️ Galeri Foto Projek (Multiple Showcase)',
              schema: {
                title: fields.text({ label: 'Judul Galeri (Opsional)' }),
                images: fields.array(
                  fields.object({
                    image: fields.image({
                      label: 'Foto Galeri',
                      directory: 'public/images/ships/gallery',
                      publicPath: '/media/ships/gallery/',
                    }),
                    imageUrl: fields.text({ label: 'Atau R2 / CDN URL (Opsional)' }),
                    caption: fields.text({ label: 'Caption Foto' }),
                  }),
                  {
                    label: 'Daftar Foto Galeri',
                    itemLabel: (props) => props.fields.caption.value || 'Foto Galeri',
                  }
                ),
              },
            }),
            VideoShowcase: block({
              label: '🎬 Video Showcase / Embed',
              schema: {
                url: fields.text({
                  label: 'Video URL (YouTube / Vimeo / MP4)',
                  description: 'Contoh: https://www.youtube.com/watch?v=... atau https://vimeo.com/...',
                }),
                caption: fields.text({ label: 'Keterangan Video (Opsional)' }),
              },
            }),
            BeforeAfter: block({
              label: '🌓 Perbandingan Before & After (Color Grading / Editing)',
              schema: {
                beforeImage: fields.image({
                  label: 'Foto Sebelum (Before / Raw)',
                  directory: 'public/images/ships/before-after',
                  publicPath: '/media/ships/before-after/',
                }),
                beforeImageUrl: fields.text({ label: 'Atau URL Before' }),
                afterImage: fields.image({
                  label: 'Foto Sesudah (After / Graded / Final)',
                  directory: 'public/images/ships/before-after',
                  publicPath: '/media/ships/before-after/',
                }),
                afterImageUrl: fields.text({ label: 'Atau URL After' }),
                caption: fields.text({ label: 'Keterangan Perbandingan (Opsional)' }),
              },
            }),
            ProjectStat: block({
              label: '📊 Highlight Angka / Metrik Projek',
              schema: {
                stats: fields.array(
                  fields.object({
                    value: fields.text({ label: 'Nilai Metrik (e.g. 500K+, 100%, 4K 60fps, 10 Hari)' }),
                    label: fields.text({ label: 'Keterangan Metrik (e.g. Views, Performance Score, Format, Waktu Produksi)' }),
                  }),
                  {
                    label: 'Daftar Metrik',
                    itemLabel: (props) => `${props.fields.value.value || ''} - ${props.fields.label.value || ''}`,
                  }
                ),
              },
            }),
            ArticleImage: block({
              label: '📸 Foto Tunggal dengan Caption',
              schema: {
                image: fields.image({
                  label: 'Pilih Foto',
                  directory: 'public/images/ships/body',
                  publicPath: '/media/ships/body/',
                }),
                imageUrl: fields.text({ label: 'Atau URL Foto (CDN)' }),
                caption: fields.text({ label: 'Keterangan Foto' }),
              },
            }),
          },
        }),
      },
    }),
  },
});
