

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
    documentId: string;
    [key: string]: any;
}


export interface StrapiMedia {
    id: number;
    documentId: string;
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


// --- STRAPI COLLECTION TYPES (FLAT STRUCTURE) ---

export type StrapiArticle = StrapiEntity & {
    title: string;
    slug: string;
    excerpt?: string;
    Content?: string;
    ContentMore?: string | null;
    Cover?: StrapiMedia | null;
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
    category?: StrapiCategory | null;
    author?: StrapiAuthor | null;
    tags?: StrapiTag[] | null;
    Name?: StrapiSeoBlock | null; 
    
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}


export type StrapiUser = {
    id: number;
    username: string;
    email: string;
    provider?: string;
    confirmed?: boolean;
    blocked?: boolean;
    favorite_articles?: StrapiArticle[];
    favorite_tags?: StrapiTag[];
    role?: {
        id: number;
        name: string;
        description: string;
        type: string;
    };
}


export type StrapiAuthor = StrapiEntity & {
    Name: string;
    Avatar?: StrapiMedia | null;
    Bio?: any; // JSON content from rich text editor
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}

export type StrapiCategory = StrapiEntity & {
    name: string;
    slug: string;
    description?: string;
    color?: string;
    img?: StrapiMedia | null;
    articles?: StrapiArticle[] | null;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}
export type StrapiIngredient = StrapiEntity & {
    nombre: string;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}
export type StrapiTag = StrapiEntity & {
   name: string;
   slug: string;
   createdAt: string;
   updatedAt: string;
   publishedAt?: string;
}

export type StrapiGalleryItem = StrapiEntity & {
    Nota: string;
    Famoso: string;
    Imagen?: StrapiMedia | null;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}
export type StrapiProduct = StrapiEntity & {
    productName: string;
    slug: string;
    price: number;
    description?: string | null;
    unidadMedida?: string | null;
    img?: StrapiMedia | null;
    category?: StrapiCategory | null;
    ingredientes?: StrapiIngredient[] | null;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
}


// --- STRAPI COMPONENT TYPES ---

export type StrapiSeoBlock = {
    id: number;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: StrapiMedia | null;
    canonicalUrl?: string;
}
