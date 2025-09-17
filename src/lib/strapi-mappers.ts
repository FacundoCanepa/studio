

'use server';
import type { ArticleDoc } from './firestore-types';
import type { StrapiArticle, StrapiTag, StrapiAuthor, StrapiCategory } from './strapi-types';
import { getStrapiMediaUrl } from './strapi-client';

export async function mapStrapiArticleToArticleDoc(item: StrapiArticle | null): Promise<ArticleDoc | null> {
    const rawItem = item?.attributes ?? item;

    if (!rawItem || !rawItem.documentId) {
        console.warn('[MAPPER] Item is null or missing raw data/documentId. Aborting map.', { item });
        return null;
    }
    
    console.log('[MAPPER] Starting to map Strapi article. DocumentID:', rawItem.documentId);
    
    const coverUrl = await getStrapiMediaUrl(rawItem.Cover?.url);
    
    const categoryData = rawItem.category;
    const category = categoryData && categoryData.id ? {
        id: categoryData.id,
        documentId: categoryData.documentId || String(categoryData.id),
        name: categoryData.name,
        slug: categoryData.slug,
    } : null;

    const authorData = rawItem.author;
    const author = authorData && authorData.id ? {
        id: authorData.id,
        documentId: authorData.documentId || String(authorData.id),
        name: authorData.Name,
        avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.url),
    } : null;
    
    const tagsSource: StrapiTag[] = Array.isArray(rawItem.tags) ? rawItem.tags : [];
    const tags = tagsSource
        .filter((t: StrapiTag) => !!t && t.id && t.name && t.slug)
        .map((t: StrapiTag) => ({
            id: t.id,
            documentId: t.documentId || String(t.id),
            name: t.name,
            slug: t.slug,
        }));
    
    const seoBlock = rawItem.Name;
    const seo = seoBlock ? {
        metaTitle: seoBlock.metaTitle,
        metaDescription: seoBlock.metaDescription,
        ogImageUrl: await getStrapiMediaUrl(seoBlock.ogImage?.url),
        canonicalUrl: seoBlock.canonicalUrl,
    } : undefined;

    const contentHtml = rawItem.Content;
    
    const carouselSource = Array.isArray(rawItem.Carosel) ? rawItem.Carosel : [];
    const carouselImages = await Promise.all(carouselSource.map(img => getStrapiMediaUrl(img?.url)));

    const out: ArticleDoc = {
        documentId: rawItem.documentId,
        id: item?.id ?? rawItem.id,
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
