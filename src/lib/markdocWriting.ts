import Markdoc from '@markdoc/markdoc';

export interface CitationItem {
  id: string;
  source: string;
  author?: string;
  url?: string;
  year?: string;
  note?: string;
}

export function renderWritingHtml(contentAst: any, slug: string): { htmlContent: string; citations: CitationItem[] } {
  if (!contentAst) return { htmlContent: '', citations: [] };

  const collectedCitations: CitationItem[] = [];

  const markdocConfig = {
    tags: {
      ArticleImage: {
        render: 'ArticleImage',
        attributes: {
          image: { type: String },
          caption: { type: String },
          credit: { type: String },
        },
        transform(node: any) {
          const { image, caption, credit } = node.attributes;
          const imgPath = image && !image.startsWith('http') && !image.startsWith('/') 
            ? `/media/body/${image}` 
            : image;

          return new Markdoc.Tag('figure', { 
            class: 'article-figure my-8 w-full block' 
          }, [
            new Markdoc.Tag('img', { 
              src: imgPath, 
              alt: caption || 'Article Image',
              class: 'w-full h-auto object-contain block m-0 p-0 border-0 outline-0 shadow-none bg-transparent',
              loading: 'lazy',
              decoding: 'async',
            }),
            (caption || credit) && new Markdoc.Tag('figcaption', { 
              class: 'article-caption text-xs mt-2 text-zinc-400 italic flex flex-col sm:flex-row justify-between gap-1 pb-2 border-b', 
              style: 'border-color: var(--border); font-family: \'Lora\', \'Newsreader\', serif;' 
            }, [
              caption && new Markdoc.Tag('span', { style: 'color: var(--text-secondary);' }, [caption]),
              credit && new Markdoc.Tag('span', { class: 'font-mono text-[11px] not-italic', style: 'color: var(--text-muted);' }, [`Foto/ ${credit}`]),
            ]),
          ].filter(Boolean));
        },
      },
      YouTubeEmbed: {
        render: 'YouTubeEmbed',
        attributes: {
          url: { type: String },
          caption: { type: String },
        },
        transform(node: any) {
          const { url, caption } = node.attributes;
          if (!url) return null;

          let videoId = url.trim();
          if (videoId.includes('v=')) {
            videoId = videoId.split('v=')[1].split('&')[0];
          } else if (videoId.includes('youtu.be/')) {
            videoId = videoId.split('youtu.be/')[1].split('?')[0];
          } else if (videoId.includes('embed/')) {
            videoId = videoId.split('embed/')[1].split('?')[0];
          }

          return new Markdoc.Tag('figure', { class: 'my-8 w-full block' }, [
            new Markdoc.Tag('div', { class: 'relative w-full aspect-video rounded-lg overflow-hidden border shadow-sm', style: 'border-color: var(--border);' }, [
              new Markdoc.Tag('iframe', {
                src: `https://www.youtube-nocookie.com/embed/${videoId}`,
                title: caption || 'YouTube Video Player',
                class: 'absolute top-0 left-0 w-full h-full border-0',
                allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
                allowfullscreen: 'true',
              }),
            ]),
            caption && new Markdoc.Tag('figcaption', { 
              class: 'article-caption text-xs mt-2 text-zinc-400 italic pb-2 border-b', 
              style: 'border-color: var(--border); font-family: \'Lora\', \'Newsreader\', serif;' 
            }, [caption]),
          ].filter(Boolean));
        },
      },
      InstagramEmbed: {
        render: 'InstagramEmbed',
        attributes: {
          url: { type: String },
          caption: { type: String },
        },
        transform(node: any) {
          const { url, caption } = node.attributes;
          if (!url) return null;

          let cleanUrl = url.trim().split('?')[0];
          if (!cleanUrl.endsWith('/')) cleanUrl += '/';
          const embedUrl = `${cleanUrl}embed`;

          return new Markdoc.Tag('figure', { class: 'my-8 max-w-md mx-auto block text-center' }, [
            new Markdoc.Tag('div', { class: 'rounded-lg overflow-hidden border bg-zinc-950/20 shadow-sm flex justify-center', style: 'border-color: var(--border);' }, [
              new Markdoc.Tag('iframe', {
                src: embedUrl,
                class: 'w-full min-h-[480px] max-w-[420px] border-0 mx-auto',
                frameborder: '0',
                scrolling: 'no',
                allowtransparency: 'true',
              }),
            ]),
            caption && new Markdoc.Tag('figcaption', { 
              class: 'article-caption text-xs mt-2 text-zinc-400 italic text-left pb-2 border-b', 
              style: 'border-color: var(--border); font-family: \'Lora\', \'Newsreader\', serif;' 
            }, [caption]),
          ].filter(Boolean));
        },
      },
      SpotifyEmbed: {
        render: 'SpotifyEmbed',
        attributes: {
          url: { type: String },
          caption: { type: String },
        },
        transform(node: any) {
          const { url, caption } = node.attributes;
          if (!url) return null;

          let cleanUrl = url.trim().split('?')[0];
          let embedSrc = cleanUrl;
          if (cleanUrl.includes('open.spotify.com/')) {
            embedSrc = cleanUrl.replace('open.spotify.com/', 'open.spotify.com/embed/');
          } else if (cleanUrl.startsWith('spotify:')) {
            const parts = cleanUrl.split(':');
            if (parts.length >= 3) {
              embedSrc = `https://open.spotify.com/embed/${parts[1]}/${parts[2]}`;
            }
          }

          const isTrack = cleanUrl.includes('/track/') || cleanUrl.includes(':track:');
          const height = isTrack ? '152' : '352';

          return new Markdoc.Tag('figure', { class: 'my-8 w-full block' }, [
            new Markdoc.Tag('div', { class: 'rounded-xl overflow-hidden shadow-sm border', style: 'border-color: var(--border);' }, [
              new Markdoc.Tag('iframe', {
                src: embedSrc,
                width: '100%',
                height: height,
                frameborder: '0',
                allowtransparency: 'true',
                allow: 'autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture',
                loading: 'lazy',
                class: 'w-full block border-0',
              }),
            ]),
            caption && new Markdoc.Tag('figcaption', { 
              class: 'article-caption text-xs mt-2 text-zinc-400 italic pb-2 border-b', 
              style: 'border-color: var(--border); font-family: \'Lora\', \'Newsreader\', serif;' 
            }, [caption]),
          ].filter(Boolean));
        },
      },
      Citation: {
        render: 'Citation',
        attributes: {
          id: { type: String, default: '1' },
          source: { type: String },
          author: { type: String },
          url: { type: String },
          year: { type: String },
          note: { type: String },
        },
        transform(node: any) {
          const { id, source, author, url, year, note } = node.attributes;
          const citeId = id || '1';

          collectedCitations.push({
            id: citeId,
            source: source || 'Referensi',
            author: author || '',
            url: url || '',
            year: year || '',
            note: note || '',
          });

          const tooltipData = encodeURIComponent(JSON.stringify({
            id: citeId,
            source: source || '',
            author: author || '',
            url: url || '',
            year: year || '',
            note: note || '',
          }));

          return new Markdoc.Tag('span', { class: 'citation-wrapper relative inline-block' }, [
            new Markdoc.Tag('sup', {
              id: `cite-ref-${citeId}`,
              class: 'citation-sup cursor-pointer select-none font-mono text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 hover:underline px-0.5 transition-colors',
              'data-citation': tooltipData,
              'data-id': citeId,
              role: 'button',
              tabindex: '0',
              'aria-label': `Catatan Kaki ${citeId}: ${source || ''}`,
            }, [`[${citeId}]`]),
          ]);
        },
      },
    },
  };

  const transformedContent = Markdoc.transform(contentAst.node || contentAst, markdocConfig);
  let rawHtml = Markdoc.renderers.html(transformedContent);

  const htmlContent = rawHtml.replace(/<img\s+([^>]*?)src="([^"]+)"/gi, (match, prefix, src) => {
    if (src.startsWith('http') || src.startsWith('/')) {
      return `<img ${prefix}src="${src}"`;
    }
    return `<img ${prefix}src="/media/writings/${slug}/${src}"`;
  });

  return { htmlContent, citations: collectedCitations };
}
