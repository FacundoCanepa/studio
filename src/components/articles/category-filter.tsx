'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { CategoryDoc } from '@/lib/firestore-types';
import { cn } from '@/lib/utils';

interface CategoryFilterProps {
  categories: CategoryDoc[];
  activeCategorySlug?: string;
}

export const CategoryFilter = ({ categories, activeCategorySlug }: CategoryFilterProps) => {
  const baseClasses = "inline-flex items-center rounded-full px-4 py-2 text-sm border transition-colors duration-200";
  const activeClasses = "bg-primary text-primary-foreground border-primary";
  const idleClasses = "bg-secondary/50 hover:bg-secondary border-transparent";
  
  return (
    <nav aria-label="Categorías" className="flex gap-3 flex-wrap">
       <Link href="/" className={cn(baseClasses, !activeCategorySlug ? activeClasses : idleClasses)}>
        Todos
      </Link>
      {categories.map((category) => (
        <Link
          key={category.documentId}
          href={`/categoria/${category.slug}`}
          className={cn(
            baseClasses,
            activeCategorySlug === category.slug ? activeClasses : idleClasses
          )}
        >
          {category.name}
        </Link>
      ))}
    </nav>
  );
};
