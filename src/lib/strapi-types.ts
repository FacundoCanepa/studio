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

export type StrapiEntity = {
    id: number;
    attributes: {
        [key: string]: any; 
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
    };
}


// A flatter type for easier use, merging attributes into the top level
type Flatten<T> = T extends object ? {
  [K in keyof T.attributes]: T.attributes[K]
} & { id: T['id'] } : T;


export type StrapiArticle = Flatten<StrapiEntity & {
    attributes: {
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
      category?: { data: StrapiCategory };
      author?: { data: StrapiAuthor };
      tags?: { data: StrapiTag[] };
      
      // SEO Component
      Name?: StrapiSeoComponent; 
      
      Carosel?: { data: StrapiMedia[] } | null;
  
      views?: number;
      saves?: number;
      type?: string;
      subcategories?: string[];
    }
  }>;
  
  export type StrapiAuthor = Flatten<StrapiEntity & {
      attributes: {
          Name: string; 
          Avatar?: { data: StrapiMedia };
          Bio?: any; // Blocks
      }
  }>;
  
  export type StrapiCategory = Flatten<StrapiEntity & {
      attributes: {
          name: string;
          slug: string;
          description?: string;
          color?: string;
      }
  }>;
  
  export type StrapiTag = Flatten<StrapiEntity & {
      attributes: {
          name: string;
          slug: string; 
      }
  }>;

export type StrapiGalleryItem = Flatten<StrapiEntity & {
    attributes: {
        Nota: string;
        Famoso: string;
        Imagen: { data: StrapiMedia };
    }
}>;


export interface StrapiMedia {
    id: number;
    attributes: {
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
    ogImage?: { data: StrapiMedia };
};
