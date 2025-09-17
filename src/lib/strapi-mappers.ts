

'use server';
import type { ArticleDoc } from './firestore-types';
import type { StrapiArticle, StrapiTag } from './strapi-types';
import { getStrapiMediaUrl } from './strapi-client';

export async function mapStrapiArticleToArticleDoc(item: StrapiArticle | null): Promise<ArticleDoc | null> {
    if (!item || !item.attributes || !item.attributes.documentId) {
        console.warn('[MAPPER] Item is null or missing attributes/documentId. Aborting map.', { item });
        return null;
    }
    
    console.log('[MAPPER] Starting to map Strapi article. DocumentID:', item.attributes.documentId);
    
    const rawItem = item.attributes;
    
    const coverUrl = await getStrapiMediaUrl(rawItem.Cover?.data?.attributes.url);
    
    const categoryData = rawItem.category?.data?.attributes;
    const categoryId = rawItem.category?.data?.id;
    const category = categoryData && categoryId ? {
        id: categoryId,
        documentId: categoryData.documentId || String(categoryId),
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        color: categoryData.color,
    } : null;

    const authorData = rawItem.author?.data?.attributes;
    const authorId = rawItem.author?.data?.id;
    const author = authorData && authorId ? {
        id: authorId,
        documentId: authorData.documentId || String(authorId),
        name: authorData.Name,
        avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.data?.attributes.url),
    } : null;
    
    const tags = (rawItem.tags?.data || [])
        .filter((t): t is StrapiTag => !!t && !!t.id && !!t.attributes?.name && !!t.attributes?.slug)
        .map(t => ({
            id: t.id,
            documentId: t.attributes.documentId || String(t.id),
            name: t.attributes.name,
            slug: t.attributes.slug,
        }));
    
    const seoBlock = (rawItem as any).seo || (rawItem as any).Name;
    const seo = seoBlock ? {
        metaTitle: seoBlock.metaTitle,
        metaDescription: seoBlock.metaDescription,
        ogImageUrl: await getStrapiMediaUrl(seoBlock.ogImage?.data?.attributes.url),
        canonicalUrl: seoBlock.canonicalUrl,
    } : undefined;

    const contentHtml = rawItem.Content;
    
    const carouselImages = rawItem.Carosel?.data && Array.isArray(rawItem.Carosel.data)
      ? await Promise.all(rawItem.Carosel.data.map(img => getStrapiMediaUrl(img?.attributes.url)))
      : [];

    const out: ArticleDoc = {
        documentId: rawItem.documentId,
        id: item.id,
        title: rawItem.title,
        slug: rawItem.slug,
        excerpt: rawItem.excerpt,
        contentHtml: contentHtml,
        coverUrl,
        featured: rawItem.featured ?? false,
        publishedAt: rawItem.publishedAt,
        createdAt: rawItem.createdAt,
        updatedAt: rawItem.updatedAt,
        views: rawItem.views ?? 0,
        saves: rawItem.saves ?? 0,
        type: rawItem.type as any,
        category,
        author,
        tags,
        subcategories: rawItem.subcategories,
        seo,
        categorySlug: category?.slug,
        tagSlugs: tags.map(t => t.slug),
        authorName: author?.name,
        informacion: rawItem.Informacion,
        contentMore: rawItem.ContentMore,
        urlYoutube: rawItem.UrlYoutube,
        carousel: (carouselImages.filter(Boolean) as string[]) ?? [],
        home: rawItem.home ?? false,
        isNew: rawItem.New ?? false,
        tendencias: rawItem.Tendencias ?? false,
    };
    
    return out;
}
