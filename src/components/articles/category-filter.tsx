'use client';

import { Button } from '@/components/ui/button';

interface CategoryFilterProps {
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (category: string) => void;
}

export const CategoryFilter = ({ categories, selectedCategory, setSelectedCategory }: CategoryFilterProps) => {
  
  const handleSelect = (categoryName: string) => {
    console.log('[UI][CategoryTabs][CLICK]', { selected: categoryName });
    setSelectedCategory(categoryName);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map(categoryName => (
        <Button
          key={categoryName}
          variant={selectedCategory === categoryName ? 'default' : 'ghost'}
          onClick={() => handleSelect(categoryName)}
          className="rounded-full"
        >
          {categoryName}
        </Button>
      ))}
    </div>
  );
};
