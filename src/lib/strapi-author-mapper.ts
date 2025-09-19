
import type { AuthorDoc } from './strapi-authors';

type UnknownRecord = Record<string, any> | null | undefined;

function pickString(source: UnknownRecord, keys: string[]): string | undefined {
  if (!source) return undefined;
  for (const key of keys) {
    if (!(key in (source as Record<string, any>))) continue;
    const value = (source as Record<string, any>)[key];
    if (value == null) continue;
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
  }
  return undefined;
}

function extractBio(source: UnknownRecord): string | undefined {
  const rawBio = (source as Record<string, any> | undefined)?.Bio;
  if (typeof rawBio === 'string') {
    return rawBio;
  }
  if (Array.isArray(rawBio)) {
    const text = rawBio
      .map((block) => {
        if (!block || typeof block !== 'object') return '';
        const children = Array.isArray(block.children) ? block.children : [];
        return children
          .map((child) => (typeof child?.text === 'string' ? child.text : ''))
          .join('');
      })
      .join('\n')
      .trim();
    return text.length > 0 ? text : undefined;
  }
  return undefined;
}


export function mapStrapiAuthorToAuthorDoc(input: unknown): AuthorDoc | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const entity = input as Record<string, any>;
  const raw = entity.attributes ?? entity;

  const documentId = raw.documentId;
  const name = raw.Name;

  if (!documentId || !name) {
    return null;
  }

  const createdAt = raw.createdAt ?? '';
  const updatedAt = raw.updatedAt ?? createdAt;

  const author: AuthorDoc = {
    documentId,
    name,
    slug: raw.slug ?? '',
    bio: extractBio(raw),
    createdAt,
    updatedAt,
    // Defaulting missing fields
    role: raw.role,
    avatarUrl: raw.Avatar?.url,
    instagram: undefined,
    tiktok: undefined,
    youtube: undefined,
    website: undefined,
    isActive: raw.isActive ?? true,
    featured: raw.featured ?? false,
  };

  return author;
}
