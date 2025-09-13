import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';
import { ArticleDoc } from '@/lib/firestore-types';

export const metadata: Metadata = {
  title: 'Moda - Vestigio Magazine',
  description: 'Artículos sobre moda masculina: outfits, tendencias y combinaciones.',
};

const articles: ArticleDoc[] = []; // Dummy data

export default function ModaPage() {
  return <CategoryPage categoryName="Moda" articles={articles} />;
}
