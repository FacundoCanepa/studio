

'use server';
import type { ArticleDoc } from './firestore-types';
import type { StrapiArticle, StrapiCategory, StrapiAuthor, StrapiTag, StrapiSeoBlock } from './strapi-types';
import { getStrapiMediaUrl } from './strapi-client';

export async function mapStrapiArticleToArticleDoc(item: StrapiArticle | null): Promise<ArticleDoc | null> {
    console.log('[MAPPER] Starting to map Strapi article. ID:', item?.id);
    if (!item || !item.id) {
        console.error('[MAPPER] Item is null or has no ID. Aborting map.');
        return null;
    }

    // Handle inconsistent Strapi response structures. Sometimes data is nested in `attributes`, sometimes not.
    const rawItem = 'attributes' in item ? item.attributes : item;
    console.log('[MAPPER_DEBUG] Raw Strapi Item Attributes:', rawItem);

    if (!rawItem) {
        console.error(`[MAPPER] Raw item data is missing for item ID: ${item.id}`);
        return null;
    }

    const coverUrl = await getStrapiMediaUrl(rawItem.Cover?.data?.attributes.url);
    
    // Robustly extract category and author, checking for `data` wrapper.
    const categoryData = rawItem.category?.data ? rawItem.category.data.attributes : rawItem.category;
    const categoryId = rawItem.category?.data ? rawItem.category.data.id : rawItem.category?.id;
    const category = categoryData ? {
        documentId: String(categoryId),
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        color: categoryData.color,
    } : null;
    console.log(`[MAPPER_DEBUG] Article ID ${item.id} - Extracted Category:`, JSON.stringify(category, null, 2));


    const authorData = rawItem.author?.data ? rawItem.author.data.attributes : rawItem.author;
    const authorId = rawItem.author?.data ? rawItem.author.data.id : rawItem.author?.id;
    const author = authorData ? {
        documentId: String(authorId),
        name: authorData.Name || authorData.name, // Handle 'Name' and 'name'
        avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.data?.attributes.url),
    } : null;
    console.log(`[MAPPER_DEBUG] Article ID ${item.id} - Extracted Author:`, JSON.stringify(author, null, 2));

    
    const tags = (rawItem.tags?.data || [])
        .filter((t): t is StrapiTag => !!t && !!t.id && !!t.attributes.name && !!t.attributes.slug)
        .map(t => ({
            documentId: String(t.id),
            name: t.attributes.name,
            slug: t.attributes.slug,
        }));
    
    const seoBlock = (rawItem as any).seo || (rawItem as any).Name; // Handle inconsistent SEO block naming
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
        documentId: String(item.id),
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
    };
    
    return out;
}
