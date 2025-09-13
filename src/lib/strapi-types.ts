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
    id: number;
    attributes: {
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
        documentId: string;
    };
}

export interface StrapiMedia {
    data: {
        id: number;
        attributes: {
            url: string;
            name: string;
            alternativeText?: string;
            caption?: string;
            width: number;
            height: number;
        };
    } | null;
}

export interface StrapiRelation<T> {
    data: T | null;
}

export interface StrapiCollection<T> {
    data: T[];
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
    attributes: {
        documentId: string;
        title: string;
        slug: string;
        excerpt?: string;
        Content?: any; // Rich text (blocks)
        cover: StrapiMedia;
        featured?: boolean;
        publishedAt?: string;

        // Relations
        category: StrapiRelation<StrapiCategory>;
        author: StrapiRelation<StrapiAuthor>;
        tags: StrapiCollection<StrapiTag>;

        // Component - THIS IS THE ACTUAL SEO component name from your schema
        Name?: StrapiSeoComponent;
    };
};

export type StrapiAuthor = StrapiEntity & {
    attributes: {
        documentId: string;
        Name: string; 
        Avatar: StrapiMedia;
        Bio?: any; // Blocks
    };
};

export type StrapiCategory = StrapiEntity & {
    attributes: {
        documentId: string;
        name: string;
        slug: string;
    };
};

export type StrapiTag = StrapiEntity & {
    attributes: {
        documentId: string;
        name: string;
        slug: string; 
    };
};
