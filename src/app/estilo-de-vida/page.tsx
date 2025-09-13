import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';
import { getArticles } from '@/lib/strapi-client';

export const metadata: Metadata = {
  title: 'Estilo de Vida - Vestigio Magazine',
  description: 'Artículos sobre hábitos, mentalidad y lifestyle masculino.',
};

export default async function EstiloDeVidaPage() {
  const allArticles = await getArticles();
  const articles = allArticles.filter(a => a.category?.slug === 'estilo-de-vida');
  return <CategoryPage categoryName="Estilo de vida" articles={articles} />;
}
