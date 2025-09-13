import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';
import { getArticles } from '@/lib/strapi-client';

export const metadata: Metadata = {
  title: 'Temporadas - Vestigio Magazine',
  description: 'Guías de estilo para Verano, Invierno, etc.',
};

export default async function TemporadasPage() {
  const allArticles = await getArticles();
  const articles = allArticles.filter(a => a.category?.slug === 'temporadas');
  return <CategoryPage categoryName="Temporadas" articles={articles} />;
}
