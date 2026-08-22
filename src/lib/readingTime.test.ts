import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from './readingTime';

describe('calculateReadingTime', () => {
  it('should return "1 min read" for empty or short text', () => {
    expect(calculateReadingTime('')).toBe('1 min read');
    expect(calculateReadingTime('Hello world')).toBe('1 min read');
  });

  it('should accurately calculate reading time for 400 words at 200 wpm', () => {
    const text = 'word '.repeat(400);
    expect(calculateReadingTime(text)).toBe('2 min read');
  });

  it('should strip markdown tokens and HTML tags before counting words', () => {
    const markdownText = '# Header\n\nThis is a **bold** text with [link](https://example.com) and <p>HTML tags</p>.';
    expect(calculateReadingTime(markdownText)).toBe('1 min read');
  });
});
