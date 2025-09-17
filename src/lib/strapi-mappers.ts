
'use server';
import type { ArticleDoc } from './firestore-types';
import type { StrapiArticle, StrapiCategory, StrapiAuthor, StrapiTag, StrapiSeoBlock } from './strapi-types';
import { getStrapiMediaUrl } from './strapi-client';

// Helper function to convert markdown-like text to basic HTML
function markdownToHtml(text: string | null | undefined): string | undefined {
    if (!text) return undefined;

    // First, escape any existing HTML to prevent injection
    // let escapedText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    // Process paragraphs (split by one or more newlines)
    let html = text.split(/\n\s*\n/).map(paragraph => {
        // Process bold and italic
        paragraph = paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        paragraph = paragraph.replace(/\*(.*?)\*/g, '<em>$1</em>');
        return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    return html;
}

function htmlToMarkdown(html: string | null | undefined): string | undefined {
    if (!html) return undefined;
    return html.replace(/<p>/g, '').replace(/<\/p>/g, '\n\n').replace(/<br>/g, '\n').trim();
}


export async function mapStrapiArticleToArticleDoc(item: StrapiArticle | null): Promise<ArticleDoc | null> {
    console.log('[MAPPER] Starting to map Strapi article. ID:', item?.id);
    if (!item || !item.id) {
        console.error('[MAPPER] Item is null or has no ID. Aborting map.');
        return null;
    }

    const rawItem = item.attributes ? item.attributes : item;

    const coverUrl = await getStrapiMediaUrl(rawItem.Cover?.data?.attributes.url);
    
    const categoryData = rawItem.category?.data?.attributes;
    const category = categoryData ? {
        documentId: String(rawItem.category?.data.id),
        name: categoryData.name,
        slug: categoryData.slug,
        description: categoryData.description,
        color: categoryData.color,
    } : null;
    console.log(`[MAPPER_DEBUG] Article ID ${item.id} - Extracted Category:`, JSON.stringify(category, null, 2));


    const authorData = rawItem.author?.data?.attributes;
    const author = authorData ? {
        documentId: String(rawItem.author?.data.id),
        name: authorData.Name,
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

    // Use htmlToMarkdown for form defaultValue, and markdownToHtml for display
    const contentHtml = rawItem.Content;
    
    const carouselImages = rawItem.Carosel?.data && Array.isArray(rawItem.Carosel.data)
      ? await Promise.all(rawItem.Carosel.data.map(img => getStrapiMediaUrl(img?.attributes.url)))
      : [];

    const out: ArticleDoc = {
        documentId: String(item.id),
        title: rawItem.title,
        slug: rawItem.slug,
        excerpt: rawItem.excerpt,
        contentHtml: contentHtml, // Store the raw content for editing
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
