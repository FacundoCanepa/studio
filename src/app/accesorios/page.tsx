import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';
import { ArticleDoc } from '@/lib/firestore-types';

export const metadata: Metadata = {
  title: 'Accesorios - Vestigio Magazine',
  description: 'Publicaciones sobre relojes, lentes, zapatos y detalles clave.',
};

const articles: ArticleDoc[] = []; // Dummy data

export default function AccesoriosPage() {
  return <CategoryPage categoryName="Accesorios" articles={articles} />;
}
