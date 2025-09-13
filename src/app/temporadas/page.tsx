import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';
import { ArticleDoc } from '@/lib/firestore-types';

export const metadata: Metadata = {
  title: 'Temporadas - Vestigio Magazine',
  description: 'Guías de estilo para Verano, Invierno, etc.',
};

const articles: ArticleDoc[] = []; // Dummy data

export default function TemporadasPage() {
  return <CategoryPage categoryName="Temporadas" articles={articles} />;
}
