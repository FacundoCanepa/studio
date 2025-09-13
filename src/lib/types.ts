// This file is being phased out in favor of strapi-types.ts and firestore-types.ts
// It is kept for now to avoid breaking existing component imports.

export type Category = 'Moda' | 'Estilo de vida' | 'Tips' | 'Accesorios' | 'Temporadas';

export type Article = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  publishedDate: string;
  category: Category;
  imageId: string;
};
