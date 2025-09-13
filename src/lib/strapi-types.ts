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
    url: string;
    name: string;
    alternativeText?: string;
    caption?: string;
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
    Content?: any; // Rich text (blocks)
    Cover?: StrapiMedia;
    featured?: boolean;
    publishedAt?: string;
    views?: number;
    saves?: number;
    type?: 'guia' | 'lista' | 'comparativa';

    // Relations
    category?: StrapiCategory;
    author?: StrapiAuthor;
    tags?: StrapiTag[];
    subcategories?: string[];

    // Component - THIS IS THE ACTUAL SEO component name from your schema
    Name?: StrapiSeoComponent;
};

export type StrapiAuthor = StrapiEntity & {
    Name: string; 
    Avatar: StrapiMedia;
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
