
'use server';
import type { ArticleDoc } from './firestore-types';
import type { StrapiArticle, StrapiCategory, StrapiAuthor, StrapiTag, StrapiSeoBlock } from './strapi-types';
import { getStrapiMediaUrl } from './strapi-client';

// Helper function to convert markdown-like text to basic HTML
function markdownToHtml(text: string | null | undefined): string | undefined {
    if (!text) return undefined;
    
    // Process paragraphs first
    let html = text.split('\\n\\n').map(p => {
        // Then process bold within each paragraph
        return `<p>${p.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`;
    }).join('');

    return html;
}

export async function mapStrapiArticleToArticleDoc(item: StrapiArticle | null): Promise<ArticleDoc | null> {
    if (!item || !item.id) return null;

    const coverUrl = await getStrapiMediaUrl(item.Cover?.url);
    
    const categoryData = item.category;
    const category = categoryData ? {
        documentId: String(categoryData.id),
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        color: categoryData.color,
    } : null;

    const authorData = item.author;
    const author = authorData ? {
        documentId: String(authorData.id),
        name: authorData.Name,
        avatarUrl: await getStrapiMediaUrl(authorData.Avatar?.url),
    } : null;
    
    const tags = (item.tags || [])
        .filter((t): t is StrapiTag => !!t && !!t.id && !!t.name && !!t.slug)
        .map(t => ({
            documentId: String(t.id),
            name: t.name,
            slug: t.slug,
        }));

    const seoBlock = item.Name; // This seems to be the SEO component from Strapi
    const seo = seoBlock ? {
        metaTitle: seoBlock.metaTitle,
        metaDescription: seoBlock.metaDescription,
        ogImageUrl: await getStrapiMediaUrl(seoBlock.ogImage?.url),
        canonicalUrl: seoBlock.canonicalUrl,
    } : undefined;

    const contentHtml = markdownToHtml(item.Content);
    
    const carouselImages = item.Carosel && Array.isArray(item.Carosel)
      ? await Promise.all(item.Carosel.map(img => getStrapiMediaUrl(img?.url)))
      : [];

    const out: ArticleDoc = {
        documentId: String(item.id),
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
        type: item.type as any,
        category,
        author,
        tags,
        subcategories: item.subcategories,
        seo,
        categorySlug: category?.slug,
        tagSlugs: tags.map(t => t.slug),
        authorName: author?.name,
        informacion: item.Informacion,
        contentMore: item.ContentMore,
        urlYoutube: item.UrlYoutube,
        carousel: (carouselImages.filter(Boolean) as string[]) ?? [],
    };

    return out;
}
