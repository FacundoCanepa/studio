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

interface StrapiEntity {
    id: number;
    attributes: {
        createdAt: string;
        updatedAt: string;
        publishedAt?: string;
        documentId: string;
    };
}

interface StrapiMedia {
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

interface StrapiRelation<T> {
    data: T | null;
}

interface StrapiCollection<T> {
    data: T[];
}

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

        // Component
        Name?: { // This is our SEO Component
            metaTitle?: string;
            metaDescription?: string;
            canonicalUrl?: string;
            ogImage?: StrapiMedia;
        };
    };
};

export type StrapiAuthor = StrapiEntity & {
    attributes: {
        documentId: string;
        Name: string; // "Name" field in Strapi
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
        slug: string; // The user mentioned it might be "tag" but we'll use "slug" as requested in the model
    };
};
