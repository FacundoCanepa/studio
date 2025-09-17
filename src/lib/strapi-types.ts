
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
    attributes: {
      documentId: string;
      [key: string]: any;
    }
}


export interface StrapiMedia {
    id: number;
    attributes: {
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


// --- STRAPI COLLECTION TYPES (with attributes property) ---

export type StrapiArticle = {
    id: number;
    attributes: {
        documentId: string;
        title: string;
        slug: string;
        excerpt?: string;
        Content?: string;
        ContentMore?: string | null;
        Cover?: { data: StrapiMedia | null };
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
        
        Carosel?: { data: StrapiMedia[] | null };
        category?: { data: StrapiCategory | null };
        author?: { data: StrapiAuthor | null };
        tags?: { data: StrapiTag[] | null };
        seo?: StrapiSeoBlock | null; 
        
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    }
}


export type StrapiUser = {
    id: number;
    username: string;
    email: string;
    provider?: string;
    confirmed?: boolean;
    blocked?: boolean;
    favorite_articles?: StrapiArticle[];
    favorite_tags?: {
        id: number;
        name: string;
        slug: string;
        documentId: string;
        createdAt: string;
        updatedAt: string;
    }[];
    role?: {
        id: number;
        name: string;
        description: string;
        type: string;
    };
}


export type StrapiAuthor = {
    id: number;
    attributes: {
        documentId: string;
        Name: string;
        Avatar?: { data: StrapiMedia | null };
        Bio?: any; // JSON content from rich text editor
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    }
}

export type StrapiCategory = {
    id: number;
    attributes: {
        documentId: string;
        name: string;
        slug: string;
        description?: string;
        color?: string;
        img?: { data: StrapiMedia | null };
        articles?: { data: StrapiArticle[] | null };
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    }
}

export type StrapiTag = {
   id: number;
   attributes: {
        documentId: string;
        name: string;
        slug: string;
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
   }
}

export type StrapiGalleryItem = {
    id: number;
    attributes: {
        documentId: string;
        Nota: string;
        Famoso: string;
        Imagen?: { data: StrapiMedia | null };
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    }
}


// --- STRAPI COMPONENT TYPES ---

export type StrapiSeoBlock = {
    id: number;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: { data: StrapiMedia | null };
    canonicalUrl?: string;
}
