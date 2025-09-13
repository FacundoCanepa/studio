import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';
import { getArticles } from '@/lib/strapi-client';

export const metadata: Metadata = {
  title: 'Tips - Vestigio Magazine',
  description: 'Consejos rápidos, hacks de vestimenta y estilo.',
};

export default async function TipsPage() {
  const allArticles = await getArticles();
  const articles = allArticles.filter(a => a.category?.slug === 'tips');
  return <CategoryPage categoryName="Tips" articles={articles} />;
}
