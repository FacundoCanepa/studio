// Firestore Document Types

export type ArticleDoc = {
  documentId: string; // UUID canónico (PRIMARY KEY en la app)
  id: number;         // id numérico de Strapi (solo referencia opcional)
  title: string;
  slug: string;
  excerpt?: string;
  contentHtml?: string;
  coverUrl?: string;
  featured?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  views?: number;
  saves?: number;
  type?: 'guia' | 'lista' | 'comparativa';

  category: { id: number, documentId: string; name: string; slug: string, description?: string, color?: string } | null;
  author:   { id: number, documentId: string; name: string; avatarUrl?: string } | null;
  tags:     Array<{ id: number, documentId: string; name: string; slug: string }>;
  subcategories?: string[];

  // Denormalized fields for queries
  categorySlug?: string;
  tagSlugs?: string[];
  authorName?: string;

  // SEO fields from Strapi component
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
    canonicalUrl?: string;
  };
  
  // Extra content fields from Strapi
  informacion?: string | null;
  contentMore?: string | null;
  urlYoutube?: string | null;
  carouselMedia?: Array<{ id: number; url: string }>;
  carousel?: string[];

  // Boolean flags
  home?: boolean;
  isNew?: boolean; // Mapped from 'New'
  tendencias?: boolean; // Mapped from 'Tendencias'
}

export type AuthorDoc = {
  id: number;
  documentId: string;
  name: string;
  avatarUrl?: string;
  bioBlocks?: any; 
  createdAt?: string;
  updatedAt?: string;
}

export type CategoryDoc = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TagDoc = {
  id: number;
  documentId: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export type SubscriberDoc = {
  documentId: string;
  email: string;
  source: "newsletter" | "google-login" | "manual" | "other";
  consent?: boolean;
  createdAt?: string;
}

export type StrapiSyncMeta = {
    lastSyncedAt?: string;
    status: 'idle' | 'syncing' | 'error';
    error?: string;
};
