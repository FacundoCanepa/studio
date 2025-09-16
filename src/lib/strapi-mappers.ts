
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

    console.log('[MAPPER] Raw Strapi Item:', JSON.stringify(item, null, 2));

    const coverUrl = await getStrapiMediaUrl(item.Cover?.data?.attributes.url);
    
    const categoryData = item.category?.data;
    const category = categoryData ? {
        documentId: String(categoryData.id),
        name: categoryData.attributes.name,
        slug: categoryData.attributes.slug,
        description: categoryData.attributes.description,
        color: categoryData.attributes.color,
    } : null;

    const authorData = item.author?.data;
    const author = authorData ? {
        documentId: String(authorData.id),
        name: authorData.attributes.Name,
        avatarUrl: await getStrapiMediaUrl(authorData.attributes.Avatar?.data?.attributes.url),
    } : null;
    
    const tags = (item.tags?.data || [])
        .filter((t): t is StrapiTag => !!t && !!t.id && !!t.attributes.name && !!t.attributes.slug)
        .map(t => ({
            documentId: String(t.id),
            name: t.attributes.name,
            slug: t.attributes.slug,
        }));

    const seoBlock = item.seo;
    const seo = seoBlock ? {
        metaTitle: seoBlock.metaTitle,
        metaDescription: seoBlock.metaDescription,
        ogImageUrl: await getStrapiMediaUrl(seoBlock.ogImage?.data?.attributes.url),
        canonicalUrl: seoBlock.canonicalUrl,
    } : undefined;

    // Use htmlToMarkdown for form defaultValue, and markdownToHtml for display
    const contentHtml = item.Content;
    
    const carouselImages = item.Carosel?.data && Array.isArray(item.Carosel.data)
      ? await Promise.all(item.Carosel.data.map(img => getStrapiMediaUrl(img?.attributes.url)))
      : [];

    const out: ArticleDoc = {
        documentId: String(item.id),
        title: item.title,
        slug: item.slug,
        excerpt: item.excerpt,
        contentHtml: contentHtml, // Store the raw content for editing
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
    
    console.log('[MAPPER] Finished mapping. Resulting ArticleDoc:', JSON.stringify(out, null, 2));

    return out;
}
