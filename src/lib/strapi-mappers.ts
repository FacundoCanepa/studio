'use server';
import type { ArticleDoc } from './firestore-types';
import type { StrapiArticle } from './strapi-types';
import { getStrapiMediaUrl } from './strapi-client';

export async function mapStrapiArticleToArticleDoc(item: StrapiArticle): Promise<ArticleDoc | null> {
    if (!item || !item.documentId) return null;

    console.log("[ARTICLES][MAP][IN]", JSON.stringify(item, null, 2));

    const coverUrl = await getStrapiMediaUrl(item.Cover?.url);
    
    const categoryData = item.category;
    const category = categoryData ? {
        documentId: categoryData.documentId,
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        color: categoryData.color,
    } : null;

    const authorData = item.author;
    const author = authorData ? {
        documentId: authorData.documentId,
        name: authorData.Name,
        avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.url),
    } : null;
    
    const tags = (item.tags || [])
        .map(t => t)
        .filter(t => t && t.documentId && t.name && t.slug)
        .map(t => ({
            documentId: t.documentId,
            name: t.name,
            slug: t.slug,
        }));

    const seoBlock = item.Name;
    const seo = seoBlock ? {
        metaTitle: seoBlock.metaTitle,
        metaDescription: seoBlock.metaDescription,
        ogImageUrl: await getStrapiMediaUrl(seoBlock.ogImage?.url),
        canonicalUrl: seoBlock.canonicalUrl,
    } : undefined;

    const contentHtml = typeof item.Content === 'string' ? item.Content : undefined;

    const out: ArticleDoc = {
        documentId: item.documentId,
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        contentHtml,
        coverUrl,
        featured: item.featured ?? false,
        publishedAt: item.publishedAt,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        views: item.views ?? 0,
        saves: item.saves ?? 0,
        type: item.type,
        category,
        author,
        tags,
        subcategories: item.subcategories,
        seo,
        categorySlug: category?.slug,
        tagSlugs: tags.map(t => t.slug),
        authorName: author?.name,
    };

    console.log("[ARTICLES][MAP][OUT]", {
        documentId: out.documentId,
        title: out.title,
        slug: out.slug,
        hasCover: Boolean(out.coverUrl),
        hasCategory: Boolean(out.category),
        hasAuthor: Boolean(out.author),
        tagCount: out.tags.length,
        hasSEO: Boolean(out.seo),
    });

    return out;
}
