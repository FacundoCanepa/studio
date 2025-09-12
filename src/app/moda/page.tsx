import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Moda - Vestigio Magazine',
  description: 'Artículos sobre moda masculina: outfits, tendencias y combinaciones.',
};

export default function ModaPage() {
  return <CategoryPage category="Moda" />;
}
