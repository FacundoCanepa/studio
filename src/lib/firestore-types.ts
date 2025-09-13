// Firestore Document Types

export type ArticleDoc = {
  documentId: string;
  title: string;
  slug: string;
  excerpt?: string;
  contentHtml?: string;
  coverUrl?: string;
  featured?: boolean;
  publishedAt?: string;
  createdAt?: string;
  updatedAt?: string;

  category: { documentId: string; name: string; slug: string } | null;
  author:   { documentId: string; name: string; avatarUrl?: string } | null;
  tags:     Array<{ documentId: string; name: string; slug: string }>;

  // Denormalized fields for queries
  categorySlug?: string;
  tagSlugs?: string[];
  authorName?: string;

  // SEO fields
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    ogImageUrl?: string;
    canonicalUrl?: string;
  };
}

export type AuthorDoc = {
  documentId: string;
  name: string;
  avatarUrl?: string;
  bioBlocks?: any; 
  createdAt?: string;
  updatedAt?: string;
}

export type CategoryDoc = {
  documentId: string;
  name: string;
  slug: string;
  createdAt?: string;
  updatedAt?: string;
}

export type TagDoc = {
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
