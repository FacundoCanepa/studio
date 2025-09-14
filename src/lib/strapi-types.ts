
// --- STRAPI RESPONSE TYPES ---

export interface StrapiResponse<T> {
  data: T;
  meta: {
    pagination?: {
      page: number;
      pageSize: number;
      pageCount: number;
      total: number;
    };
  };
}

export interface StrapiEntity {
    id: number;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}

export interface StrapiMedia {
    id: number;
    name: string;
    alternativeText?: string;
    caption?: string;
    width?: number;
    height?: number;
    formats?: {
        thumbnail: StrapiMediaFormat;
        small?: StrapiMediaFormat;
        medium?: StrapiMediaFormat;
        large?: StrapiMediaFormat;
    };
    hash: string;
    ext: string;
    mime: string;
    size: number;
    url: string;
    previewUrl?: string;
    provider: string;
    provider_metadata: any;
    createdAt: string;
    updatedAt: string;
}

export interface StrapiMediaFormat {
    name: string;
    hash: string;
    ext: string;
    mime: string;
    width: number;
    height: number;
    size: number;
    path?: string;
    url: string;
}


// --- STRAPI COLLECTION TYPES ---

export interface StrapiArticle extends StrapiEntity {
    title: string;
    slug: string;
    excerpt?: string;
    Content?: string;
    ContentMore?: string | null;
    Cover?: StrapiMedia;
    featured?: boolean;
    home?: boolean;
    New?: boolean;
    Tendencias?: boolean;
    views?: number;
    saves?: number;
    type?: 'guia' | 'lista' | 'comparativa';
    subcategories?: string[];
    Informacion?: string | null;
    UrlYoutube?: string | null;
    
    Carosel?: StrapiMedia[] | null;
    category?: StrapiCategory;
    author?: StrapiAuthor;
    tags?: StrapiTag[];
    Name?: StrapiSeoBlock; // This seems to be the SEO component
}


export interface StrapiAuthor extends StrapiEntity {
    Name: string;
    Avatar?: StrapiMedia;
    Bio?: any; // JSON content from rich text editor
}

export interface StrapiCategory extends StrapiEntity {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    img?: StrapiMedia;
    articles?: StrapiArticle[];
}

export interface StrapiTag extends StrapiEntity {
    name: string;
    slug: string;
}

export interface StrapiGalleryItem extends StrapiEntity {
    Nota: string;
    Famoso: string;
    Imagen?: StrapiMedia;
}


// --- STRAPI COMPONENT TYPES ---

export interface StrapiSeoBlock {
    id: number;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: StrapiMedia;
    canonicalUrl?: string;
}
