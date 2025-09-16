
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
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    }
}

export interface StrapiMedia {
    id: number;
    attributes: {
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


// --- STRAPI COLLECTION TYPES ---

export interface StrapiArticle extends StrapiEntity {
    attributes: {
        title: string;
        slug: string;
        excerpt?: string;
        Content?: string;
        ContentMore?: string | null;
        Cover?: { data: StrapiMedia };
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
        category?: { data: StrapiCategory };
        author?: { data: StrapiAuthor };
        tags?: { data: StrapiTag[] };
        seo?: StrapiSeoBlock; 
        
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    }
}


export interface StrapiUser extends StrapiEntity {
    username: string;
    email: string;
    provider?: string;
    confirmed?: boolean;
    blocked?: boolean;
    favorite_articles?: { data: StrapiArticle[] };
    favorite_tags?: { data: StrapiTag[] };
    role?: {
        id: number;
        name: string;
        description: string;
        type: string;
    };
}


export interface StrapiAuthor extends StrapiEntity {
    attributes: {
        Name: string;
        Avatar?: { data: StrapiMedia };
        Bio?: any; // JSON content from rich text editor
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    }
}

export interface StrapiCategory extends StrapiEntity {
    attributes: {
        name: string;
        slug: string;
        description?: string;
        color?: string;
        img?: { data: StrapiMedia };
        articles?: { data: StrapiArticle[] };
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    }
}

export interface StrapiTag extends StrapiEntity {
   attributes: {
        name: string;
        slug: string;
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
   }
}

export interface StrapiGalleryItem extends StrapiEntity {
    attributes: {
        Nota: string;
        Famoso: string;
        Imagen?: { data: StrapiMedia };
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    }
}


// --- STRAPI COMPONENT TYPES ---

export interface StrapiSeoBlock {
    id: number;
    metaTitle?: string;
    metaDescription?: string;
    ogImage?: { data: StrapiMedia };
    canonicalUrl?: string;
}
