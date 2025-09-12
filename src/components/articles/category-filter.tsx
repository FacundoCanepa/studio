'use client';

import { categories } from '@/lib/data';
import type { Category } from '@/lib/types';
import { Button } from '@/components/ui/button';

interface CategoryFilterProps {
  selectedCategory: Category | 'Todos';
  setSelectedCategory: (category: Category | 'Todos') => void;
}

const allCategories = [{ name: 'Todos' as const }, ...categories];

export const CategoryFilter = ({ selectedCategory, setSelectedCategory }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {allCategories.map(category => (
        <Button
          key={category.name}
          variant={selectedCategory === category.name ? 'default' : 'ghost'}
          onClick={() => setSelectedCategory(category.name)}
          className="rounded-full"
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};
