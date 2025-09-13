import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';
import { ArticleDoc } from '@/lib/firestore-types';

export const metadata: Metadata = {
  title: 'Tips - Vestigio Magazine',
  description: 'Consejos rápidos, hacks de vestimenta y estilo.',
};

const articles: ArticleDoc[] = []; // Dummy data

export default function TipsPage() {
  return <CategoryPage categoryName="Tips" articles={articles} />;
}
