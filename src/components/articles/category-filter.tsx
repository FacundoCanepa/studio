'use client';

import { Button } from '@/components/ui/button';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export const CategoryFilter = ({ categories, selectedCategory, setSelectedCategory }: CategoryFilterProps) => {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(categoryName => (
        <Button
          key={categoryName}
          variant={selectedCategory === categoryName ? 'default' : 'ghost'}
          onClick={() => setSelectedCategory(categoryName)}
          className="rounded-full"
        >
          {categoryName}
        </Button>
      ))}
    </div>
  );
};
