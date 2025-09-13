import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';
import { getArticles } from '@/lib/strapi-client';

export const metadata: Metadata = {
  title: 'Accesorios - Vestigio Magazine',
  description: 'Publicaciones sobre relojes, lentes, zapatos y detalles clave.',
};

export default async function AccesoriosPage() {
  const allArticles = await getArticles();
  const articles = allArticles.filter(a => a.category?.slug === 'accesorios');
  return <CategoryPage categoryName="Accesorios" articles={articles} />;
}
