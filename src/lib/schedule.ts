export interface PublishScheduleInfo {
  publishDate?: string | null;
  draft?: boolean | null;
  publicationType?: any;
  edition?: string | null;
}

export interface EditionScheduleInfo {
  publishDate?: string | null;
  draft?: boolean | null;
}

/**
 * Mengubah tanggal dan jam ke Date objek dengan penanganan akurat Zona Waktu WIB (UTC+7)
 */
export function parsePublishDateTime(publishDate?: string | null): Date {
  if (!publishDate) return new Date(0);

  // Jika berformat ISO datetime string (e.g. 2026-08-16T14:00)
  if (publishDate.includes('T')) {
    if (!publishDate.includes('+') && !publishDate.endsWith('Z')) {
      const parts = publishDate.split('T');
      const timePart = parts[1] || '00:00';
      const timeSegments = timePart.split(':');
      const hh = String(parseInt(timeSegments[0], 10) || 0).padStart(2, '0');
      const mm = String(parseInt(timeSegments[1], 10) || 0).padStart(2, '0');
      const wibIso = `${parts[0]}T${hh}:${mm}:00+07:00`;
      const parsedWithWib = new Date(wibIso);
      if (!isNaN(parsedWithWib.getTime())) return parsedWithWib;
    }
    const parsedIso = new Date(publishDate);
    if (!isNaN(parsedIso.getTime())) return parsedIso;
  }

  // Jika format hanya tanggal YYYY-MM-DD
  const dateOnlyIso = `${publishDate}T00:00:00+07:00`;
  const parsed = new Date(dateOnlyIso);
  return isNaN(parsed.getTime()) ? new Date(publishDate) : parsed;
}

/**
 * Memeriksa apakah suatu Edisi Majalah Mingguan sudah resmi rilis
 */
export function isEditionPublished(edition?: EditionScheduleInfo | null): boolean {
  if (!edition) return false;
  if (edition.draft) return false;
  if (!edition.publishDate) return true;

  const releaseDate = parsePublishDateTime(edition.publishDate);
  const now = new Date();
  return releaseDate.getTime() <= now.getTime();
}

/**
 * Memeriksa apakah suatu Artikel sudah resmi rilis (mendukung pewarisan jadwal dari Edisi Majalah)
 */
export function isArticlePublished(
  article?: PublishScheduleInfo | null,
  parentEdition?: EditionScheduleInfo | null
): boolean {
  if (!article) return false;
  if (article.draft) return false;

  const pubType = typeof article.publicationType === 'object' && article.publicationType !== null
    ? article.publicationType.discriminant
    : (article.publicationType || 'reguler');

  // Jika artikel merupakan bagian dari Majalah Edisi Mingguan
  if (pubType === 'mingguan') {
    // Jika parentEdition diberikan, status rilis artikel mengikuti rilis Edisi Induk
    if (parentEdition) {
      if (!isEditionPublished(parentEdition)) {
        return false;
      }
    }
  }

  // Cek tanggal & jam terbit artikel itu sendiri
  if (article.publishDate) {
    const articleReleaseDate = parsePublishDateTime(article.publishDate);
    const now = new Date();
    if (articleReleaseDate.getTime() > now.getTime()) {
      return false;
    }
  }

  return true;
}
