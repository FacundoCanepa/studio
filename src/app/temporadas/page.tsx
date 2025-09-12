import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Temporadas - Vestigio Magazine',
  description: 'Guías de estilo para Verano, Invierno, etc.',
};

export default function TemporadasPage() {
  return <CategoryPage category="Temporadas" />;
}
