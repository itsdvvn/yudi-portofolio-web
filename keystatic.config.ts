import { config, fields, collection } from '@keystatic/core';

export default config({
  storage: {
    kind: 'local',
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
          label: 'Hero / Featured Image',
          directory: 'src/assets/writings',
          publicPath: '/src/assets/writings/',
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
          label: 'Cover / Thumbnail Image',
          directory: 'src/assets/ships',
          publicPath: '/src/assets/ships/',
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
