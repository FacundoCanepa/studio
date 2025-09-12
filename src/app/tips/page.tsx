import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tips - Vestigio Magazine',
  description: 'Consejos rápidos, hacks de vestimenta y estilo.',
};

export default function TipsPage() {
  return <CategoryPage category="Tips" />;
}
