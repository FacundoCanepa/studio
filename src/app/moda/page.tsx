import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';
import { getArticles } from '@/lib/strapi-client';

export const metadata: Metadata = {
  title: 'Moda - Vestigio Magazine',
  description: 'Artículos sobre moda masculina: outfits, tendencias y combinaciones.',
};

export default async function ModaPage() {
  const allArticles = await getArticles();
  const articles = allArticles.filter(a => a.category?.slug === 'moda');
  return <CategoryPage categoryName="Moda" articles={articles} />;
}
