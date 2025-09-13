// Strapi API response types

export interface StrapiResponse<T> {
    data: T;
    meta?: {
        pagination: {
            page: number;
            pageSize: number;
            pageCount: number;
            total: number;
        };
    };
}

export interface StrapiEntity {
    id: number; // Strapi ID
    documentId: string; // Firebase documentId if available
    attributes: {
        [key: string]: any; 
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    };
}

// Flattened type for easier use
export type StrapiFlatEntity<T> = {
    documentId: string;
} & T;

export interface StrapiMedia {
    id: number;
    documentId: string;
    url: string;
    name: string;
    alternativeText?: string | null;
    caption?: string | null;
    width: number | null;
    height: number | null;
    formats?: {
        thumbnail: StrapiMediaFormat;
        small?: StrapiMediaFormat;
        medium?: StrapiMediaFormat;
        large?: StrapiMediaFormat;
    };
}

export interface StrapiMediaFormat {
    ext: string;
    url: string;
    hash: string;
    mime: string;
    name: string;
    path: string | null;
    size: number;
    width: number;
    height: number;
}


// --- SEO Component ---
export type StrapiSeoComponent = { 
    id: number;
    metaTitle: string;
    metaDescription?: string;
    canonicalUrl?: string;
    ogImage?: StrapiMedia;
};


// --- Content Types ---

export type StrapiArticle = StrapiFlatEntity<{
    title: string;
    slug: string;
    excerpt?: string;
    Content?: any; // Rich text (blocks) or Markdown
    Cover?: StrapiMedia;
    featured?: boolean;
    
    home?: boolean | null;
    Informacion?: string | null;
    UrlYoutube?: string | null;
    ContentMore?: string | null;
    New?: boolean | null;
    Tendencias?: boolean | null;

    // Relations
    category?: StrapiCategory;
    author?: StrapiAuthor;
    tags?: StrapiTag[];
    
    // SEO Component
    Name?: StrapiSeoComponent; 
    
    Carosel?: StrapiMedia[] | null;

    views?: number;
    saves?: number;
    type?: string;
    subcategories?: string[];
}>;

export type StrapiAuthor = StrapiFlatEntity<{
    Name: string; 
    Avatar?: StrapiMedia;
    Bio?: any; // Blocks
}>;

export type StrapiCategory = StrapiFlatEntity<{
    name: string;
    slug: string;
    description?: string;
    color?: string;
}>;

export type StrapiTag = StrapiFlatEntity<{
    name: string;
    slug: string; 
}>;
