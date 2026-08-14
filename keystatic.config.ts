import { config, fields, collection, singleton } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
  },
  singletons: {
    profile: singleton({
      label: 'Homepage Profile & Sections',
      path: 'src/content/profile/index',
      format: { data: 'json' },
      schema: {
        avatarImage: fields.image({
          label: 'Avatar / Profile Photo (Pilih / Upload File)',
          directory: 'public/images/profile',
          publicPath: '/media/profile/',
        }),
        avatarUrl: fields.text({
          label: 'Atau Avatar R2 CDN URL (Opsional direct link: https://media.itsdvvn.my.id/...)',
        }),
        headline: fields.text({
          label: 'Greeting / Headline (H1)',
          defaultValue: "Halo, saya Yudi",
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
            year: fields.text({ label: 'Tahun (e.g. 2019 - 2023)' }),
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
            period: fields.text({ label: 'Periode (e.g. 2023 – now)' }),
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
        socials: fields.object({
          youtube: fields.url({ label: 'YouTube URL' }),
          instagram: fields.url({ label: 'Instagram URL' }),
          tiktok: fields.url({ label: 'TikTok URL' }),
          discord: fields.url({ label: 'Discord URL' }),
          github: fields.url({ label: 'GitHub URL' }),
          xTwitter: fields.url({ label: 'X / Twitter URL' }),
          email: fields.text({ label: 'Email Address' }),
        }),
      },
    }),
  },
  collections: {
    writings: collection({
      label: 'Writings (Blog)',
      slugField: 'title',
      path: 'src/content/writings/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Headline (H1)' } }),
        category: fields.text({ label: 'Category / Topic', defaultValue: 'Article' }),
        deck: fields.text({ label: 'Deck / Subheadline', multiline: true }),
        publishDate: fields.date({ label: 'Publication Date', defaultValue: { kind: 'today' } }),
        publishTime: fields.text({ label: 'Publication Time (e.g. 14:30 WIB)', defaultValue: '10:00 AM' }),
        readTime: fields.text({ label: 'Reading Time (e.g. 4 min read)', defaultValue: '3 min read' }),
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
        tags: fields.array(fields.text({ label: 'Tag' }), {
          label: 'Tags',
          itemLabel: (props) => props.value || 'Tag',
        }),
        draft: fields.checkbox({ label: 'Draft', defaultValue: false }),
        content: fields.markdoc({
          label: 'Article Body Content',
        }),
      },
    }),
    thoughts: collection({
      label: 'Thoughts (Micro-Posts)',
      slugField: 'id',
      path: 'src/content/thoughts/*',
      format: { contentField: 'content' },
      schema: {
        id: fields.slug({ name: { label: 'Short ID / Title' } }),
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
      schema: {
        title: fields.slug({ name: { label: 'Project / Artwork Title' } }),
        category: fields.select({
          label: 'Category',
          options: [
            { label: 'Photography', value: 'Photography' },
            { label: 'Videography / Motion', value: 'Videography' },
            { label: 'Design & Visual Arts', value: 'Design' },
            { label: 'Code & Web Development', value: 'Code' },
            { label: 'Other Multimedia', value: 'Multimedia' },
          ],
          defaultValue: 'Photography',
        }),
        description: fields.text({ label: 'Short Description / Story', multiline: true }),
        coverImage: fields.image({
          label: 'Cover / Thumbnail Image (Pilih / Upload File)',
          directory: 'public/images/ships',
          publicPath: '/media/ships/',
        }),
        coverImageUrl: fields.text({
          label: 'Atau Cover R2 CDN URL (Opsional: https://media.itsdvvn.my.id/...)',
        }),
        videoUrl: fields.url({ label: 'Video URL (YouTube / Vimeo / Google Drive / Direct link)' }),
        link: fields.url({ label: 'Live Link / Portfolio URL (Behance, Instagram, Demo, etc.)' }),
        github: fields.url({ label: 'GitHub Repo (if code project)' }),
        tools: fields.array(fields.text({ label: 'Tool / Gear' }), {
          label: 'Tools & Gear (e.g. Sony A7IV, Premiere Pro, Figma, Astro)',
          itemLabel: (props) => props.value || 'Tool',
        }),
        year: fields.text({ label: 'Year', defaultValue: '2025' }),
        featured: fields.checkbox({ label: 'Featured on Homepage', defaultValue: false }),
        content: fields.markdoc({
          label: 'Project Showcase / Behind the Scenes / Case Study',
        }),
      },
    }),
  },
});
