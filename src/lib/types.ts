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
