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
    documentId: string;
    [key: string]: any; 
}

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

export type StrapiArticle = StrapiEntity & {
    title: string;
    slug: string;
    excerpt?: string;
    Content?: any; // Rich text (blocks) or Markdown
    Cover?: StrapiMedia;
    featured?: boolean;
    publishedAt?: string;
    
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
    
    // SEO Component, assuming it's named 'Name' in your Strapi schema
    Name?: StrapiSeoComponent; 
    
    Carosel?: StrapiMedia[] | null;
};

export type StrapiAuthor = StrapiEntity & {
    Name: string; 
    Avatar?: StrapiMedia;
    Bio?: any; // Blocks
};

export type StrapiCategory = StrapiEntity & {
    name: string;
    slug: string;
    description?: string;
    color?: string;
};

export type StrapiTag = StrapiEntity & {
    name: string;
    slug: string; 
};
