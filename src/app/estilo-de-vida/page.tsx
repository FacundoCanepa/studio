import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Estilo de Vida - Vestigio Magazine',
  description: 'Artículos sobre hábitos, mentalidad y lifestyle masculino.',
};

export default function EstiloDeVidaPage() {
  return <CategoryPage category="Estilo de vida" />;
}
