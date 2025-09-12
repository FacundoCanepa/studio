import { CategoryPage } from '@/components/categories/category-page';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Accesorios - Vestigio Magazine',
  description: 'Publicaciones sobre relojes, lentes, zapatos y detalles clave.',
};

export default function AccesoriosPage() {
  return <CategoryPage category="Accesorios" />;
}
