import type { AuthorDoc } from './strapi-authors';

type UnknownRecord = Record<string, any> | null | undefined;

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
          .map((child: any) => (typeof child?.text === 'string' ? child.text : ''))
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
  
  const articles = Array.isArray(raw.articles?.data)
    ? raw.articles.data.map((article: any) => ({
        id: article.id,
        title: article.attributes?.title ?? 'Título no disponible',
      }))
    : [];
    const avatarUrlFromNested = typeof raw.Avatar?.data?.attributes?.url === 'string'
    ? raw.Avatar.data.attributes.url
    : undefined;
  const avatarUrlFromRoot = typeof raw.Avatar?.url === 'string' ? raw.Avatar.url : undefined;

  const author: AuthorDoc = {
    id: entity.id,
    documentId,
    name,
    bio: extractBio(raw),
    createdAt,
    updatedAt,
    avatarUrl: avatarUrlFromRoot ?? avatarUrlFromNested,
    articles: articles,
  };

  return author;
}