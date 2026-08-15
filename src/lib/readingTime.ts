/**
 * Calculates accurate reading time based on total word count.
 * Standard adult reading speed: 200 words per minute (WPM).
 */
export function calculateReadingTime(text: string, wpm = 200): string {
  if (!text) return '1 min read';

  // Strip HTML tags and markdown formatting characters
  const cleanText = text
    .replace(/<[^>]*>?/gm, ' ')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
    .replace(/[*_#`~>+-]/g, ' ')             // markdown tokens
    .trim();

  const words = cleanText.split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / wpm));

  return `${minutes} min read`;
}
