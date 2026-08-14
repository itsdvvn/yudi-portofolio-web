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
        photoCredit: fields.text({ label: 'Photo Credit (e.g. Photo by John Doe on Unsplash)' }),
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
      label: 'Ships (Projects)',
      slugField: 'title',
      path: 'src/content/ships/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({ name: { label: 'Project Title' } }),
        description: fields.text({ label: 'Short Description', multiline: true }),
        status: fields.select({
          label: 'Status',
          options: [
            { label: 'Live', value: 'live' },
            { label: 'Building / In Progress', value: 'building' },
            { label: 'Archived', value: 'archived' },
          ],
          defaultValue: 'live',
        }),
        year: fields.text({ label: 'Year', defaultValue: '2025' }),
        link: fields.url({ label: 'Live URL' }),
        github: fields.url({ label: 'GitHub Repository' }),
        techStack: fields.array(fields.text({ label: 'Tech' }), {
          label: 'Tech Stack',
          itemLabel: (props) => props.value || 'Technology',
        }),
        featured: fields.checkbox({ label: 'Featured on Homepage', defaultValue: false }),
        content: fields.markdoc({
          label: 'Project Details / Case Study',
        }),
      },
    }),
  },
});
