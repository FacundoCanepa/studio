'use client';

import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { CategoryDoc } from '@/lib/firestore-types';

interface CategoryFilterProps {
  categories: CategoryDoc[];
  activeCategorySlug?: string;
}

export const CategoryFilter = ({ categories = [], activeCategorySlug }: CategoryFilterProps) => {

  return (
    <div className="space-y-6">
        <div>
            <h4 className="font-headline text-lg mb-3">Categorías</h4>
            <nav aria-label="Categorías" className="flex flex-col gap-2 items-start">
            <Link href="/page" className={cn(
                'text-foreground/80 hover:text-primary transition-colors',
                !activeCategorySlug && 'text-primary font-semibold'
            )}>
                Todos
            </Link>
            {categories.map((category) => (
                <Link
                key={category.documentId}
                href={`/categoria/${category.slug}`}
                className={cn(
                    'text-foreground/80 hover:text-primary transition-colors',
                    activeCategorySlug === category.slug && 'text-primary font-semibold'
                )}
                >
                {category.name}
                </Link>
            ))}
            </nav>
        </div>
        <div className="pt-6 border-t border-border/50">
            <h4 className="font-headline text-lg mb-3">Ordenar Por</h4>
             {/* Placeholder for Sort controls */}
        </div>
        <div className="pt-6 border-t border-border/50">
            <h4 className="font-headline text-lg mb-3">Tags Frecuentes</h4>
            {/* Placeholder for Tag controls */}
        </div>
         <div className="pt-6 border-t border-border/50">
            <h4 className="font-headline text-lg mb-3">Tipo de Contenido</h4>
            {/* Placeholder for Type toggle */}
        </div>
    </div>
  );
};
