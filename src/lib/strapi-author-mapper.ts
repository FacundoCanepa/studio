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

function coerceBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (['true', '1', 'yes', 'on', 'activo', 'activa'].includes(normalized)) return true;
    if (['false', '0', 'no', 'off', 'inactivo', 'inactiva'].includes(normalized)) return false;
  }
  return fallback;
}

function extractAvatarUrl(source: UnknownRecord): string | undefined {
  const direct =
    pickString(source, ['avatarUrl', 'avatar_url', 'AvatarUrl', 'AvatarURL']) ??
    pickString(source, ['avatar']);
  if (direct) return direct;

  const avatar = (source as Record<string, any> | undefined)?.avatar ?? (source as Record<string, any> | undefined)?.Avatar;
  if (!avatar) return undefined;

  if (typeof avatar === 'string') {
    return avatar;
  }

  return (
    pickString(avatar, ['url']) ??
    pickString(avatar?.data?.attributes, ['url'])
  );
}

function extractBio(source: UnknownRecord): string | undefined {
  const rawBio = (source as Record<string, any> | undefined)?.bio ?? (source as Record<string, any> | undefined)?.Bio;
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

function normalizeDocumentId(raw: UnknownRecord, fallback: UnknownRecord): string | undefined {
  const documentId =
    pickString(raw, ['documentId', 'DocumentId', 'document_id']) ??
    pickString(fallback, ['documentId']);
  return documentId;
}

function normalizeTiktok(source: UnknownRecord): string | undefined {
  return pickString(source, ['tiktok', 'Tiktok', 'TikTok']);
}

export function mapStrapiAuthorToAuthorDoc(input: unknown): AuthorDoc | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const entity = input as Record<string, any>;
  const raw = entity.attributes && typeof entity.attributes === 'object'
    ? { ...entity.attributes }
    : entity;

  const documentId = normalizeDocumentId(raw, entity);
  const name = pickString(raw, ['name', 'Name']);

  if (!documentId || !name) {
    return null;
  }

  const createdAt = pickString(raw, ['createdAt']) ?? pickString(entity, ['createdAt']) ?? '';
  const updatedAt = pickString(raw, ['updatedAt']) ?? pickString(entity, ['updatedAt']) ?? createdAt;

  const author: AuthorDoc = {
    documentId,
    name,
    slug: pickString(raw, ['slug', 'Slug']) ?? '',
    bio: extractBio(raw),
    role: pickString(raw, ['role', 'Role']),
    avatarUrl: extractAvatarUrl(raw),
    instagram: pickString(raw, ['instagram', 'Instagram']),
    tiktok: normalizeTiktok(raw),
    youtube: pickString(raw, ['youtube', 'Youtube', 'YouTube']),
    website: pickString(raw, ['website', 'Website']),
    isActive: coerceBoolean(raw.isActive ?? raw.IsActive ?? raw.active, true),
    featured: coerceBoolean(raw.featured ?? raw.Featured, false),
    createdAt,
    updatedAt,
  };

  return author;
}