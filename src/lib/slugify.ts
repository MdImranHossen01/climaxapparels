import { slugify as tSlugify } from 'transliteration';

/**
 * Generates a URL-friendly slug from a given string.
 * Supports Bengali transliteration to English.
 * 
 * @param text The string to slugify
 * @returns A URL-friendly slug string
 */
export const slugify = (text: string): string => {
  if (!text) return '';

  // Use transliteration for multi-language support (especially Bengali)
  return tSlugify(text, {
    lowercase: true,
    separator: '-',
    trim: true,
  })
  .replace(/[^\w\s-]/g, '')    // Remove non-word characters (except spaces and dashes)
  .replace(/[\s_-]+/g, '-')    // Replace spaces and underscores with a single dash
  .slice(0, 100)               // Limit length
  .replace(/^-+|-+$/g, '');    // Trim dashes from start and end
};

