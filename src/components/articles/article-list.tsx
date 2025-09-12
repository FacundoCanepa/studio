'use client';

import { useState } from 'react';
import { articles } from '@/lib/data';
import type { Category } from '@/lib/types';
import { CategoryFilter } from './category-filter';
import { ArticleCard } from './article-card';
import { FadeIn } from '../shared/fade-in';

export const ArticleList = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'Todos'>('Todos');

  const filteredArticles = articles.filter(article => 
    selectedCategory === 'Todos' || article.category === selectedCategory
  );

  return (
    <div>
      <CategoryFilter
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
      />
      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-12">
        {filteredArticles.map((article, index) => (
          <FadeIn key={article.id} delay={index * 100}>
            <ArticleCard article={article} />
          </FadeIn>
        ))}
      </div>
    </div>
  );
};
