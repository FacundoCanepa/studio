

'use server';
import type { ArticleDoc } from './firestore-types';
import type { StrapiArticle, StrapiTag } from './strapi-types';
import { getStrapiMediaUrl } from './strapi-client';

export async function mapStrapiArticleToArticleDoc(item: StrapiArticle | null): Promise<ArticleDoc | null> {
    // Determine the correct source for the article's raw data.
    // The Strapi API might return data directly or nested under 'attributes'.
    const rawItem = item?.attributes ? item.attributes : item;

    if (!rawItem || !rawItem.documentId) {
        console.warn('[MAPPER] Item is null or missing raw data/documentId. Aborting map.', { item });
        return null;
    }
    
    console.log('[MAPPER] Starting to map Strapi article. DocumentID:', rawItem.documentId);
    
    const coverUrl = await getStrapiMediaUrl(rawItem.Cover?.data?.attributes.url);
    
    const categoryData = rawItem.category?.data?.attributes ?? rawItem.category;
    const categoryId = rawItem.category?.data?.id ?? rawItem.category?.id;
    const category = categoryData && categoryId ? {
        id: categoryId,
        documentId: categoryData.documentId || String(categoryId),
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        color: categoryData.color,
    } : null;

    const authorData = rawItem.author?.data?.attributes ?? rawItem.author;
    const authorId = rawItem.author?.data?.id ?? rawItem.author?.id;
    const author = authorData && authorId ? {
        id: authorId,
        documentId: authorData.documentId || String(authorId),
        name: authorData.Name,
        avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.data?.attributes.url),
    } : null;
    
    const tagsSource = rawItem.tags?.data ?? rawItem.tags ?? [];
    const tags = tagsSource
        .filter((t: any): t is StrapiTag => !!t && (t.id || t.documentId) && (t.attributes?.name || t.name) && (t.attributes?.slug || t.slug))
        .map((t: any) => {
            const tagAttrs = t.attributes ?? t;
            return {
                id: t.id,
                documentId: tagAttrs.documentId || String(t.id),
                name: tagAttrs.name,
                slug: tagAttrs.slug,
            };
        });
    
    const seoBlock = (rawItem as any).seo || (rawItem as any).Name;
    const seo = seoBlock ? {
        metaTitle: seoBlock.metaTitle,
        metaDescription: seoBlock.metaDescription,
        ogImageUrl: await getStrapiMediaUrl(seoBlock.ogImage?.data?.attributes.url),
        canonicalUrl: seoBlock.canonicalUrl,
    } : undefined;

    const contentHtml = rawItem.Content;
    
    const carouselSource = rawItem.Carosel?.data ?? rawItem.Carosel ?? [];
    const carouselImages = Array.isArray(carouselSource)
      ? await Promise.all(carouselSource.map(img => getStrapiMediaUrl(img?.attributes?.url ?? img?.url)))
      : [];

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
