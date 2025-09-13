import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';
import { ArticleDoc } from '@/lib/firestore-types';

export const metadata: Metadata = {
  title: 'Estilo de Vida - Vestigio Magazine',
  description: 'Artículos sobre hábitos, mentalidad y lifestyle masculino.',
};

const articles: ArticleDoc[] = []; // Dummy data

export default function EstiloDeVidaPage() {
  return <CategoryPage categoryName="Estilo de vida" articles={articles} />;
}
