import type { AuthorDoc } from './strapi-authors';

type UnknownRecord = Record<string, any> | null | undefined;

function extractArticles(source: UnknownRecord): Array<{ id: number; title: string }> {
  if (!source || typeof source !== 'object') {
    return [];
  }

  const results = new Map<number, { id: number; title: string }>();

  const addArticle = (article: any) => {
    if (!article || typeof article !== 'object') {
      return;
    }

    const entity = article as Record<string, any>;
    const rawArticle = entity.attributes ?? entity;

    const rawId = typeof entity.id === 'number' ? entity.id : rawArticle?.id;
    const id = typeof rawId === 'number' ? rawId : undefined;
    if (id === undefined) {
      return;
    }

    const titleFromRaw = typeof rawArticle?.title === 'string' ? rawArticle.title : undefined;
    const titleFromAttributes = typeof entity.attributes?.title === 'string' ? entity.attributes.title : undefined;
    const title = titleFromRaw ?? titleFromAttributes ?? 'Título no disponible';

    results.set(id, { id, title });
  };

  const flatArticles = Array.isArray((source as Record<string, any>).articles)
    ? (source as Record<string, any>).articles
    : [];
  flatArticles.forEach(addArticle);

  const nestedArticles = Array.isArray((source as Record<string, any>).articles?.data)
    ? (source as Record<string, any>).articles.data
    : [];
  nestedArticles.forEach(addArticle);

  return Array.from(results.values());
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
  
  const articles = extractArticles(raw);
  const avatarUrlFromNested = typeof raw.Avatar?.data?.attributes?.url === 'string'
    ? raw.Avatar.data.attributes.url
    : undefined;
  const avatarUrlFromString = typeof raw.Avatar === 'string' ? raw.Avatar : undefined;
  const avatarUrlFromRoot = typeof raw.Avatar?.url === 'string' ? raw.Avatar.url : undefined;

  const author: AuthorDoc = {
    id: entity.id,
    documentId,
    name,
    bio: extractBio(raw),
    createdAt,
    updatedAt,
    avatarUrl: avatarUrlFromRoot ?? avatarUrlFromNested ?? avatarUrlFromString,
    articles: articles,
  };

  return author;
}